# MckD Markdown Renderer

The MckD Markdown Renderer is a versatile tool for converting Markdown into HTML. Here's a guide on how to leverage its functionalities:

## Installation

To begin using the MckD Markdown Renderer, follow these steps:

1. **Download:** Obtain the MckD library from the [GitHub repository](https://github.com/0m0g1/mckd.js).
2. **Setup:** Include the `Mckd.js` file in your project's source.

## Usage

### Example

Create a html file where the markdown will be displayed.

```Html
<div class="markdown-display">
  <!-- Rendered Markdown will appear here -->
</div>
```

Initialize the MckD Markdown Renderer by importing it into your project:

```javascript
import MckD from "../src/Mckd.js";
const markdownInterpreter = new MckD({ "element": ".markdown-display" });
markdownInterpreter.render(markdownText);
```

### Explanation

MckD will create an iframe in the element which you've specified while initializind the renderer.
This is where the rendered markdown will be displayed.
The `render()` method is what changes the html of the iframe.
