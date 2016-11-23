"use babel";

class Provider {
  selector = ".source.js";
  disableForSelector = ".source.js .comment";
  inclusionPriority = 1;
  suggestionPriority = 2;
  excludeLowerPriority = true;

  constructor(client) {
    this.client = client;
  }

  async getSuggestions({ editor, bufferPosition, prefix }) {
    const path = editor.getPath();
    const content = editor.getText();
    this.client.send("open", {
      file: path,
      fileContent: content,
    });
    const response = await this.client.send("completions", {
      file: path,
      line: bufferPosition.row + 1,
      offset: bufferPosition.column + 1,
      prefix,
    }, true);
    return response.body
      .filter(item => (
        item.name.startsWith(prefix)
      ))
      .map(item => ({
        text: item.name,
      }));
  }
}

export default Provider;
