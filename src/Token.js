class Token {
    constructor(type = null, value = null, rootType = null, otherKeys = {}) {
        this.type = type;
        this.value = value;
        this.rootType = rootType;
        this.otherKeys = otherKeys;
    }
}

export default Token;