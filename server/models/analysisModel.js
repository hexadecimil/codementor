export default class Analysis {
    constructor({
        id,
        project_id,
        commit_sha,
        status,
        files_total,
        code_overview,
        mermaid_diagram,
        error_message,
        analysis_date,
    } = {}) {
        this.id = id;
        this.project_id = project_id;
        this.commit_sha = commit_sha;
        this.status = status;
        this.files_total = files_total;
        this.code_overview = code_overview;
        this.mermaid_diagram = mermaid_diagram;
        this.error_message = error_message;
        this.analysis_date = analysis_date;
    }
}
