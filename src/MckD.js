import Renderer from "./Renderer.js";

class MckD {
    constructor() {
        this.renderer = new Renderer();
    }
    interprate(text) {
        return this.renderer.Render(text);
    }
}

export default MckD;