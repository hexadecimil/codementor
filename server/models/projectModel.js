export default class Project {
    constructor({ id, user_id, github_repo_url, created_at } = {}) {
        this.id = id;
        this.user_id = user_id;
        this.github_repo_url = github_repo_url;
        this.created_at = created_at;
    }
}
