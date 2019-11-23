const {fetch_json, upstreamPrefix, gatewayServer, gateway, formats, torrentRejectList } = require( './Util');
const prettierBytes = require( "prettier-bytes");
const waterfall = require('async/waterfall');
//const DwebTransports = require('@internetarchive/dweb-transports'); //Not "required" because available as window.DwebTransports by separate import

/**
 * Represents a single file, currently one that is in the item, but might create sub/super classes to handle other types
 * of file e.g. images used in the UI
 *
 * Fields:
 * magnetlink: is magnet link of parent
 * metadata: metadata of item - (note will be a pointer into a Detail or Search's metadata so treat as read-only)
 *
 */
class ArchiveFile {
  constructor({itemid = undefined, magnetlink = undefined, metadata = undefined}={}) {
    this.itemid = itemid;
    this.magnetlink = magnetlink;
    if (typeof metadata.downloaded !== "undefined") {
      // Support dweb-mirror which stores downloaded as AF.metadata.downloaded but needs it as AF.downloaded
      this.downloaded = metadata.downloaded;
      delete(metadata.downloaded);
    }
    this.metadata = metadata;
    if (this.metadata.name.endsWith("_archive.torrent")) {
      // Dont trust the files info for _archive.torrent as will fetch via dweb-torrent service which modifies both.
      this.metadata.sha1 = undefined;
      this.metadata.size = undefined;
    }
  }

  /**
   *
   * @param archiveitem   Instance of ArchiveItem with or without its metadata loaded
   * @param filename      Name of an existing file, (may be multipart e.g. foo/bar)
   * @param copyDirectory Where to store any data cached, (if running in DwebMirror)
   * @param cb(err, ArchiveFile)  errors: FileNotFound or errors from ArchiveFile or fetch_metadata()
   * @returns {Promise<ArchiveFile>|undefined} if no cb
   */
  static new({archiveitem=undefined, filename=undefined, copyDirectory=undefined}={}, cb) {
    if (cb) { return f.call(this, cb) } else { return new Promise((resolve, reject) => f.call(this, (err, res) => { if (err) {reject(err)} else {resolve(res)} }))}
    function f(cb) {
      if (!archiveitem.metadata) {
        archiveitem.fetch_metadata({copyDirectory}, (err, ai) => { // Note will load from cache if available and load ai.metadata and ai.files
          if (err)  { cb(err) } else { this.new({itemid: ai.itemid, magnetlink: ai.magnetlink, filename}, cb); } })
      } else {
        const af = archiveitem.files.find(af => af.metadata.name === filename); // af, (undefined if not found)
        return af ? cb(null, af) : cb(new Error(`${archiveitem.itemid}/${filename} not found`));
      }
    }
  };

  /**
   * Name suitable for downloading etc
   * @returns string
   */
  name() {
    return this.metadata.name;
  }

  /**
   * @returns: true if expect file to be in torrent
   */
  inTorrent() {
    /* Not checking the following things which require access to item, but in all cases this should result
      in there being no magnetlink anyway.
      - !item.metadata.noarchivetorrent
      - collections doesnt include loggedin || georestricted, ditto
      - item_size < 80530636800 (75GB) || any collection doesnt start with open_ and size < 250GB
      Also not checking mtime < item....torrentfile....mtime as dont have access to that here, which means could attempt
      to read old file from torrent.   Torrents are typically out of date if ...
      Known bug in Traceys code as of 13Nov2018 where doesnt update torrent when writing __ia_thumb.jpg
      Large torrents can be behind on updates
      If files count is large there is a bug with some part of the tools process Aaron let me know about, setting to 20k as a guess
      TODO In python code this was taken from we checked this, and reported errors, could add here
     */
    return !torrentRejectList.some(ext => this.metadata.name.endsWirth(ext));
  }
  /**
   *
   * @param cb(err, [URL])  Array of urls that might be a good place to get this item
   * @returns {Promise<[URL]>} if no cb
   * @errors if fetch_json doesn't succeed, or retrieves something other than JSON
   */
  // TODO-TORRENT make consumer pass in magnetlink or maybe utem if has it
  urls(cb) { //TODO-MIRROR fix this to make sense for _torrent.xml files which dont have sha1 and probably not IPFS
    if (cb) { try { f.call(this, cb) } catch(err) { cb(err)}} else { return new Promise((resolve, reject) => { try { f.call(this, (err, res) => { if (err) {reject(err)} else {resolve(res)} })} catch(err) {reject(err)}})} // Promisify pattern v2
    function f(cbout) {
      // noinspection JSUnresolvedFunction
      const res = [this.httpUrl()];
      if (this.metadata.name.endsWith("_archive.torrent")) {
        cbout(null,
          // Either mirror URL or to torrent service
          (((typeof DwebArchive !== "undefined") && DwebArchive.mirror )
            ? [DwebArchive.mirror, 'download', this.itemid].join('/')
            : 'http://www-dweb-torrent.dev.archive.org'
          ) +  "/" + this.metadata.name);
      } else {
        waterfall([
          (cb) => DwebTransports.p_connectedNames(cb),
          (connectedNames, cb) => { // Look whether should add magnet link
            if (connectedNames.includes("WEBTORRENT") && this.magnetlink && this.inTorrent()) {
              // TODO-TORRENT needs to do "inTorrent" work from Archive.py and also exclude __ia_thumb.jpg
              res.push([this.magnetlink, this.metadata.name].join('/'));
            }
            cb(null, connectedNames);
          },
          // TODO-TORRENT think through returning dweb-torrent URL esp for _torrent.xml
          (connectedNames, cb) => { // Decide if need to get file-specific metadata because missing dweb urls
            if  (!this.metadata.ipfs && connectedNames.includes("IPFS")) {
              // Connected to IPFS but dont have IPFS URL yet (not included by default because IPFS caching is slow)
              // Fjords: 17BananasIGotThis/17 Bananas? I Got This!.mp3  has a '?' in it
              let name = this.metadata.name.replace('?', '%3F');
              // TODO using fetch_json on server is ok, but it would be better to incorporate Gun & Wolk and go via DwebTransports
              // maybe problem offline but above test should catch cases where no IPFS so not useful
              fetch_json(`${gatewayServer()}/metadata/${this.itemid}/${encodeURIComponent(name)}`,
                (err, fileMeta)=>{
                  if (!err) {
                    if (fileMeta.ipfs) { res.push(fileMeta.ipfs); }
                    if (fileMeta.contenthash) { res.push(fileMeta.contenthash); }
                  }
                  cb(err, res);
              });
            } else {
              cb(null, res);
            }},
        ], cbout);
      }
    }
  }

  /**
   * Find a HTTP URL - three cases:
   * on browser direct: want dweb.archive.org as need CORS protection
   * on dweb-mirror: want archive.org as no benefit going through dweb.archive.org (see https://github.com/internetarchive/dweb-mirror/issues/242)
   * on browser to DM: want localhost (which gatewayServer will return
   * @returns {URL} http URL - typically on dweb.archive.org or localhost:4244
   */
  httpUrl() {
    return [ upstreamPrefix(), "download", this.itemid, this.metadata.name].join('/');
  }

  /**
   * @returns STRING  converted from metadata.format to a real mime type
   */
  mimetype() {
    let f =  formats("format", this.metadata.format);
    if (typeof f === "undefined") {
      const ext = this.metadata.name.split('.').pop();
      f =  formats("ext", "."+ext)
    }
    return  (typeof f === "undefined") ? undefined : f.mimetype;
  }

  // noinspection DuplicatedCode
  /**
   *
   * Fetch data, normally you should probably be streaming instead.
   * Not timed-out currently as only used in .blob which could be slow on big files
   *
   * @param cb(err, buffer as returned by DwebTransports.fetch)
   * @returns {Promise<buffer>} if no cb
   * @errors TransportError if urls empty or cant fetch;
   *
   */
  data(cb) {
    if (cb) { try { f.call(this, cb) } catch(err) { cb(err)}} else { return new Promise((resolve, reject) => { try { f.call(this, (err, res) => { if (err) {reject(err)} else {resolve(res)} })} catch(err) {reject(err)}})} // Promisify pattern v2
    function f(cb) {
      waterfall([
        (cb) => this.urls(cb),
        (res, cb2) => DwebTransports.fetch(res, {}, cb2),
      ], cb)
    }
  }

  /**
   *  Not timedout currently as could be slow on big files
   * @param cb(err, URL) Url of blob
   * @errors see data()
   */
  blobUrl(cb) {  //
    this.data((err, data) => {
      if (err) {
        cb(err);
      } else {
        cb(null, URL.createObjectURL(
          new Blob([data], {type: this.mimetype()})));
      }
    })
  }

  /**
   * @returns {string} of the size suitable for pretty printing or ""
   */
  sizePretty() {
    try {
      return this.metadata.size
        ? prettierBytes(parseInt(this.metadata.size))
        : ""; // For example files.xml has no size field
    } catch (err) {
      debug("ERROR - cant get size for %s/%s", this.itemid, this.metadata.name);
      return "";
    }
  }

  /**
   *
   * @param type        From range in format field of util._formatarr e.g. "PDF" or "JPEG Thumb"
   * @returns {boolean} True if file is of appropriate type
   */
  istype(type) {
    // True if specify a type and it matches, or don't specify a type BUT fails if type unrecognized
    let format = formats("format", this.metadata.format);
    //if (!format) console.warn("Format", this.metadata.format, "unrecognized");
    return format && (!type || (format.type === type));
  }

  /**
   * @param type  as in format field of _formatarr
   * @returns {boolean} if can be played (based on _formatarr)
   */
  // noinspection JSUnusedGlobalSymbols
  playable(type) {
    return this.istype(type) && formats("format", this.metadata.format).playable;
  }

  /**
   * @param type as in format field of _formatarr
   * @returns {boolean} true if downloadable
   */
  downloadable(type) {
    return this.istype(type) && !!formats("format", this.metadata.format).downloadable;
  }

}
exports = module.exports = ArchiveFile;

//Code Inspection 2019-09-26
