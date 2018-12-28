// From https://git.archive.org/arthur/ia-validate TODO manually update from time to time
//TODO-IAUX rework metadata process to use nonrepeatable_fields instead of repeatable_fields
item_rules = {
    "required_fields": ["identifier", "mediatype", "publicdate", "title", "uploader"],
    "repeatable_fields": ["boxid", "collection", "creator", "description", "external-identifier", "isbn", "language", "lccn", "oclc-id", "openlibrary_author", "openlibrary_subject", "public-format", "related-external-id", "subject", "updated", "updatedate", "updater"],
    "nonrepeatable_fields": ["access-restricted", "aspect_ratio", "audio_sample_rate", "betterpdf", "bookreader-defaults", "ccnum", "closed_captioning", "date", "foldoutcount", "frames_per_second", "hidden", "identifier", "identifier-ark", "imagecount", "licenseurl", "mediatype", "next_item", "noindex", "openlibrary", "openlibrary_edition", "openlibrary_work", "page-progression", "ppi", "previous_item", "publicdate", "repub_state", "republisher_date", "republisher_operator", "republisher_time", "runtime", "source_pixel_height", "source_pixel_width", "start_localtime", "start_time", "stop_time", "title", "uploader", "utc_offset", "viruscheck", "year"],
    "deprecated_fields": ["addeddate", "openlibrary", "republisher"],
    "recommended_fields": ["description"],
    "regex_patterns": {
        "identifier": "^[a-zA-Z0-9@][a-zA-Z0-9_\\-\\.]{4,99}$",
        "mediatype": "^(texts|etree|audio|movies|software|image|data|web|collection|account)$",
        "title": "\\s*\\S+",
        "collection": "^[a-zA-Z0-9][a-zA-Z0-9_\\-\\.]{1,99}$",
        "uploader": "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+[^\\s]$|^tpb$",
        "publicdate": "^[1-2][0-9]{3}-(0[0-9]|1[0-2])-([0-2][0-9]|3[01])( ([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\\.[0-9]+)?)?$",
        "date": "^([1-2][0-9]{3}-(0[0-9]|1[0-2])-([0-2][0-9]|3[01])|[1-2][0-9]{3}-(0[0-9]|1[0-2])|[1-2][0-9]{3})( ([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\\.[0-9]+)?)?([\\+\\-][0-9][0-9]?(:[0-9][0-9])?)?$",
        "imagecount": "^[0-9]+$",
        "repub_state": "^-?[0-9]+$",
        "year": "^[1-2][0-9]{3}$",
        "access-restricted": "^true$",
        "noindex": "^true$",
        "ppi": "^[0-9]+$",
        "runtime": "^([0-9]+:[0-5][0-9]:[0-5][0-9]|([0-5])?[0-9]:[0-5][0-9])$",
        "start_localtime": "^[1-2][0-9]{3}-(0[0-9]|1[0-2])-([0-2][0-9]|3[01])( ([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\\.[0-9]+)?)?$",
        "start_time": "^[1-2][0-9]{3}-(0[0-9]|1[0-2])-([0-2][0-9]|3[01])( ([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\\.[0-9]+)?)?$",
        "stop_time": "^[1-2][0-9]{3}-(0[0-9]|1[0-2])-([0-2][0-9]|3[01])( ([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\\.[0-9]+)?)?$",
        "utc_offset": "^-?[0-9]+$",
        "audio_sample_rate": "^-?[0-9]+$",
        "frames_per_second": "^-?([0-9]+|[0-9]*\\.[0-9]+)$",
        "source_pixel_width": "^-?[0-9]+$",
        "source_pixel_height": "^-?[0-9]+$",
        "aspect_ratio": "^[0-9]+:[0-9]+$",
        "closed_captioning": "^(yes|no)$",
        "ccnum": "^(cc[0-9]+|asr|ocr|[0-5])$",
        "updatedate": "^[1-2][0-9]{3}-(0[0-9]|1[0-2])-([0-2][0-9]|3[01])( ([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\\.[0-9]+)?)?$",
        "updated": "^[1-2][0-9]{3}-(0[0-9]|1[0-2])-([0-2][0-9]|3[01])$",
        "foldoutcount": "^-?[0-9]+$",
        "page-progression": "lr|rl",
        "previous_item": "^[a-zA-Z0-9@][a-zA-Z0-9_\\-\\.]{4,99}$",
        "next_item": "^[a-zA-Z0-9@][a-zA-Z0-9_\\-\\.]{4,99}$",
        "licenseurl": "https?://(?:[-\\w.]|(?:%[\\da-fA-F]{2}))+",
        "boxid": "^(IA|ia|OL|ol)[0-9]+$",
        "bookreader-defaults": "^mode/[12]up$",
        "betterpdf": "^true$",
        "republisher_operator": "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+[^\\s]$",
        "republisher_date": "^[1-2][0-9]{3}((0[0-9]|1[0-2])([0-2][0-9]|3[01])([0-2][0-9][0-5][0-9][0-5][0-9])?)?$",
        "republisher_time": "^-?[0-9]+$",
        "hidden": "^true$",
        "identifier-ark": "ark:/[0-9]+/[0-9a-zA-Z]+",
        "openlibrary": "^OL[0-9]+M$",
        "openlibrary_edition": "^OL[0-9]+M$",
        "openlibrary_work": "^OL[0-9]+W$",
        "openlibrary_author": "^OL[0-9]+A$",
        "lccn": "^-?[0-9]+$",
        "viruscheck": "^true$"
    },
    "custom_rules": {"isbn": "is_isbn()"},
    "files_rules": {"length": "is_not_length_zero()"}
}

exports = module.exports = item_rules;