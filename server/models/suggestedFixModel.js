export default class SuggestedFix {
    constructor({ id, detected_error_id, description, suggested_code } = {}) {
        this.id = id;
        this.detected_error_id = detected_error_id;
        this.description = description;
        this.suggested_code = suggested_code;
    }
}
