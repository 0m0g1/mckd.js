import Lexer from "./lexer.js";
import Token from "./token.js";
import tokenTypes from "./tokens.js";

class Parser {
    constructor(lexer) {
        this.lexer = lexer;
        this.previousToken = null;
        this.currentToken = this.lexer.getNextToken();
    }
    eat(tokenType) {
        if (tokenType == this.currentToken.type) {
            this.previousToken = this.currentToken;
            this.currentToken = this.lexer.getNextToken();
        } else {
            throw(`Unexpected token type "${this.currentToken.tokenType}" expected "${tokenType}" instead`)
        }
    }
    parseNewline() {
        this.eat(tokenTypes.newline);

        if (this.currentToken.type == tokenTypes.newline) {
            this.eat(tokenTypes.newline);
            return new Token(tokenTypes.newline);
        }
        
        return null;
    }
    parseHeader() {
        const headerValue = this.currentToken.value;
        this.eat(tokenTypes.header);
        this.eat(tokenTypes.string);
        const header = this.previousToken;

        if (this.currentToken.type == tokenTypes.newline) {
            this.eat(tokenTypes.newline);
            this.previousToken = new Token(tokenTypes[`h${headerValue}`], header.value, tokenTypes.header);
        }

        return new Token(tokenTypes[`h${headerValue}`], header.value, tokenTypes.header);
    }
    parseString() {
        this.eat(tokenTypes.string);

        if (this.currentToken.type == tokenTypes.newline) {
            const previousToken = this.previousToken;
            this.eat(tokenTypes.newline);
            this.previousToken = previousToken;
            
            if (this.currentToken.type == tokenTypes.equal) {
                return this.parseEqual();
            }
        }

        const lexer = new Lexer(this.previousToken.value);
        const tokens = [];
        let currentToken = lexer.getNextToken();

        while (currentToken.type != tokenTypes.eoi) {
            tokens.push(currentToken);
            currentToken = lexer.getNextToken();
        }

        console.log(tokens);

        return this.previousToken;
    }
    parseEqual() {
        const previousToken = this.previousToken;
        this.eat(tokenTypes.equal);
        
        if (previousToken.type == tokenTypes.string) {
            return new Token(tokenTypes.h1, previousToken.value, tokenTypes.header);
        }
        
        this.previousToken = new Token(tokenTypes.string, this.previousToken.value);

        return this.previousToken;
    }
    parseUl() {
        const listItems = [];
        
        while (this.currentToken.type == tokenTypes.ul) {
            this.eat(tokenTypes.ul);
            if (this.currentToken.type == tokenTypes.string) {
                this.eat(tokenTypes.string);
                listItems.push(this.previousToken.value);
                if (this.currentToken.type == tokenTypes.newline) {
                    this.eat(tokenTypes.newline);
                }
            }
        }

        return new Token(tokenTypes.ul, listItems);
    }
    parseOl() {
        const listItems = [];
        const start = this.currentToken.otherKeys.start;

        while (this.currentToken.type == tokenTypes.ol) {
            this.eat(tokenTypes.ol);
            this.eat(tokenTypes.string);
            listItems.push(this.previousToken.value);
            if (this.currentToken.type == tokenTypes.newline) {
                this.eat(tokenTypes.newline);
            }
        }

        const olToken = new Token(tokenTypes.ol, listItems);
        olToken.otherKeys.start = start;
        return olToken;
    }
    parseBlockquote() {
        this.eat(tokenTypes.blockquote);

        if (this.currentToken.type == tokenTypes.string) {
            this.eat(tokenTypes.string);

        } else if (this.currentToken.type == tokenTypes.link) {
            this.eat(tokenTypes.link);
            const linkToken = `<a href="${this.previousToken.value}" target="_blank">${this.previousToken.otherKeys.linkText}</a>`
            return new Token(tokenTypes.blockquote, linkToken);
        }

        return new Token(tokenTypes.blockquote, this.previousToken.value);
    }
    parseBold() {
        this.eat(tokenTypes.bold);

        if (this.currentToken.type == tokenTypes.string) {
            const paragraph = `
            <b>${this.previousToken.value}</b>${this.currentToken.value}
            `
            this.eat(tokenTypes.string);
            return new Token(tokenTypes.string, paragraph);
        }

        return this.previousToken;
    }
    parseItalic() {
        this.eat(tokenTypes.italic);

        if (this.currentToken.type == tokenTypes.string) {
            const paragraph = `
            <i>${this.previousToken.value}</i>${this.currentToken.value}
            `
            this.eat(tokenTypes.string);
            return new Token(tokenTypes.string, paragraph);
        }
        
        return this.previousToken;
    }
    parse() {
        const tokens = [];
        if (this.currentToken.type == tokenTypes.newline) {
            const result = this.parseNewline();
            if (result != null) {  
                tokens.push(result);
            }
            tokens.push(...this.parse());

        } else if (this.currentToken.type == tokenTypes.header) {
            tokens.push(this.parseHeader());
            tokens.push(...this.parse());
            
        } else if (this.currentToken.type == tokenTypes.string) {
            tokens.push(this.parseString());
            tokens.push(...this.parse());
            
        } else if (this.currentToken.type == tokenTypes.equal) {
            tokens.push(this.parseEqual());
            tokens.push(...this.parse());
            
        } else if (this.currentToken.type == tokenTypes.ul) {
            tokens.push(this.parseUl());
            tokens.push(...this.parse());

        } else if (this.currentToken.type == tokenTypes.ol) {
            tokens.push(this.parseOl());
            tokens.push(...this.parse());

        } else if (this.currentToken.type == tokenTypes.hr) {
            tokens.push(this.currentToken);
            this.eat(tokenTypes.hr);
            tokens.push(...this.parse());
            
        } else if (this.currentToken.type == tokenTypes.blockquote) {
            tokens.push(this.parseBlockquote());
            tokens.push(...this.parse());

        } else if (this.currentToken.type == tokenTypes.img) {
            tokens.push(this.currentToken);
            this.eat(tokenTypes.img);
            tokens.push(...this.parse());

        } else if (this.currentToken.type == tokenTypes.bold) {
            tokens.push(this.parseBold());
            tokens.push(...this.parse());
            
        } else if (this.currentToken.type == tokenTypes.italic) {
            tokens.push(this.parseItalic());
            tokens.push(...this.parse());
        }
        
        return tokens;
    }
}

export default Parser;