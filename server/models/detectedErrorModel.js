export default class DetectedError {
    constructor({
        id,
        analyzed_file_id,
        line_number,
        error_type,
        severity,
        description,
        code_snippet,
        fix_description,
        fix_suggested_code,
    } = {}) {
        this.id = id;
        this.analyzed_file_id = analyzed_file_id;
        this.line_number = line_number;
        this.error_type = error_type;
        this.severity = severity;
        this.description = description;
        this.code_snippet = code_snippet;
        this.fix_description = fix_description;
        this.fix_suggested_code = fix_suggested_code;
    }
}
