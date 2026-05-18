export default class User {
    constructor({ id, github_id, access_token, created_at } = {}) {
        this.id = id;
        this.github_id = github_id;
        this.access_token = access_token;
        this.created_at = created_at;
    }
}
