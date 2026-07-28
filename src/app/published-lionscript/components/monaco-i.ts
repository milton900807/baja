interface MonacoSuggestion {
    label: string;
    kind: monaco.languages.CompletionItemKind;
    insertText: string;
    documentation: string;
  }
  