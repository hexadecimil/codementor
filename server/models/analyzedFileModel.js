export default class AnalyzedFile {
    constructor({ id, analysis_id, file_path, language, file_summary } = {}) {
        this.id = id;
        this.analysis_id = analysis_id;
        this.file_path = file_path;
        this.language = language;
        this.file_summary = file_summary;
    }
}
