import { Component, OnInit, Input, NgZone, OnDestroy } from '@angular/core';
import { PubComponent } from '../pub-component';
import { ElementRef, ViewChild } from '@angular/core';
import { PubComponentListener } from '../pub-component-listener';
import { IoniScriptEngine, LionEngine } from '../../engine/io-engine';
import { IoniScriptManager } from '../../engine/io-manager';
import { AuthService } from '../../onedrive/auth.service';
import { FunctionUtil } from '../../functions/function-util';
import { BaseEditor } from 'ngx-monaco-editor-v2/lib/base-editor';
// import { monaco } from "monaco-editor";

@Component({
  selector: 'text-editor',
  templateUrl: './texteditor-component.html',
  styleUrls: ['./../jsonviewer.component.scss'],
  // Navy rounded border + light-gray panel for the simple text-editor. The border/radius
  // sit on the .nt-monaco container; ::ng-deep paints Monaco's own background light gray
  // (Monaco renders its bg inline from the theme, so it needs piercing overrides). Scoped
  // to .nt-monaco so other Monaco editors are unaffected.
  styles: [`
    .nt-monaco { border: 2px solid #0a2a66 !important; border-radius: 12px !important; overflow: hidden !important; background: #e8e8e8; }
    .nt-monaco ::ng-deep .monaco-editor,
    .nt-monaco ::ng-deep .monaco-editor .monaco-editor-background,
    .nt-monaco ::ng-deep .monaco-editor .margin,
    .nt-monaco ::ng-deep .monaco-editor .overflow-guard { background-color: #e8e8e8 !important; }
  `]
})
export class TextEditorComponent implements OnInit, PubComponent, OnDestroy {
  [x: string]: any;
  // @ViewChild('meditor', { static: true }) _meditor: ElementRef;
  @ViewChild('codeEditor', { static: false }) _meditor!: BaseEditor;

  fun: any;
  showEditor = false;
  listener: PubComponentListener;
  resolveFunction: any;
  title: string;
  @Input()
  data = '';
  @Input()
  initData = '';
  code: string = '';
  file_data: string = '';
  output: string = '';
  @Input()
  editorOptions: { language: 'text', automaticLayout: true };
  logOptions = { language: 'text', automaticLayout: true, validate: false };
  io: IoniScriptManager;
  libs: string[];
  style = "height:100%; width:95%"
  border = true;
  active = 1
  editorpanelstyle = 'border: none; overflow: auto; height: 100% ';
  file_title = '';
  code_title = '';
  io_title = '';
  mode = 'simple'
  height = '500px'
  @Input()
  folderPath = '/me/drive/root'
  selectedFile;
  currentPath = '';
  fileName = '';
  modal_mode = 'Save'
  selectedObjects = '';
  editor = null;
  editable = true;
  suggestions;
  completionProvider;


  constructor(private fg: IoniScriptEngine, private msgraph: AuthService, private zone: NgZone) {




  }



  apply(value: string) {
    if (this.resolveFunction) {
    }
  }

  setPath(ev) {
    this.currentPath = ev;
  }


  getFileName() {
    return this.file_title;
  }

  // private msgraph: AuthService
  //         this.msgraph.getClient().then(async (client) => {
  async save(currentPath, fileName) {
    if (fileName.startsWith('/')) {
      fileName = fileName.substring(1).trim();
    }
    let client = await this.msgraph.getClient();
    await client.api(`/me/drive/root:/ljl-screens/${currentPath}/${fileName}:/content`).put(this.code)
    // this.modalService.dismissAll()
  }



  isTextEditorVisible(): boolean {
    if (!this._meditor) {
      return false; // textEditor is not available in the DOM
    }

    // Access the native element using Angular's ElementRef
    const element = this._meditor?._editorContainer.nativeElement;

    if (!element) {
      return false; // No valid native element found
    }
    const style = window.getComputedStyle(element);
    console.log(' element visibility: ' + element.visibility);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }


  ngOnDestroy(): void {

    if (this.completionProvider) {
      this.completionProvider.dispose();
    }

  }

  getActiveTab() {
    return this.active;
  }
  getActiveTabName() {
    if (this.active === 1) {
      return this.code_title;
    } else if (this.active === 2) {
      return this.file_title;
    } else {
      return this.io_title;
    }
  }
  setSelected(selections) {
    this.selectedObjects = selections;
  }


  open(evt) {

  }

  getActiveTabContent() {
    if (this.active === 1) {
      return this.code;
    } else if (this.active === 2) {
      return this.file_data;
    } else {
      return this.output;
    }
  }
  log(str) {
    this.output += '\n' + str;
  }
  setData(jsonString) {
    this.code = jsonString;
  }
  getData() {
    return this.code;
  }
  print(content) {
    this.output = content;
  }
  getIO() {
    return this.output;
  }
  setActive(tab) {
    this.active = tab;
  }
  closeResult = '';

  openModal(modalcontent, mode) {
    this.modal_mode = mode;
  }
  close() {
  }
  private getDismissReason(reason: any): string {
    return `with: ${reason}`;
  }
  private convertObjectsToGroupSuggestions(objects) {
    let suggestionsSet = new Set(); // Set to ensure distinct suggestions
    let propertiesSet = new Set();   // Set to ensure distinct properties
    objects.forEach(obj => {
      if (obj.name && Array.isArray(obj.wells)) {
        obj.wells.forEach(row => {
          row.forEach(well => {
            if (well && well.group && typeof well.group === 'object') {
              // Iterate over the keys of the well.group dictionary
              Object.keys(well.group).forEach(groupKey => {
                let property = `${groupKey}`;
                if (!propertiesSet.has(property)) {
                  propertiesSet.add(property); // Add to Set for distinct properties
                  suggestionsSet.add(JSON.stringify({
                    label: property,
                    kind: monaco.languages.CompletionItemKind.Property,
                    insertText: property,
                    documentation: `Group: ${groupKey} under ${obj.name}`
                  })); // Store stringified object to ensure uniqueness
                }
              });
            }
          });
        });
      }


      if (!suggestionsSet.has(obj.name)) {
        suggestionsSet.add(JSON.stringify({
          label: obj.name.trim(),
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: obj.name.trim(),
          documentation: `Object: ${obj.name}`
        }));
      }


    });
    const mathFunctions = [
      {
        label: 'average',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'average(',
        documentation: 'Calculates the average of the specified property or properties.'
      },
      {
        label: 'sum',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'sum(',
        documentation: 'Calculates the sum of the specified property or properties.'
      },
      {
        label: 'min',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'min(',
        documentation: 'Returns the minimum value of the specified property or properties.'
      },
      {
        label: 'max',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'max(',
        documentation: 'Returns the maximum value of the specified property or properties.'
      },
      {
        label: 'power',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'power(${1:property}, ${2:exponent})',
        documentation: 'Raises the specified property to the power of the exponent.'
      },
      {
        label: 'sqrt',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'sqrt(',
        documentation: 'Returns the square root of the specified property.'
      },
      {
        label: 'log',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'log(${1:property}, ${2:base})',
        documentation: 'Returns the logarithm of the specified property with the given base.'
      }
    ];

    // Add math functions to the suggestions list, ensuring distinctness
    mathFunctions.forEach(func => {
      if (!suggestionsSet.has(func.label)) {
        suggestionsSet.add(JSON.stringify(func));
      }
    });

    // Convert the Sets back to arrays and parse JSON objects for suggestions
    let suggestions = Array.from(suggestionsSet).map(item => JSON.parse(item.toString()));
    let properties = Array.from(propertiesSet);

    return {
      suggestions: suggestions,
      properties: properties, // Return distinct properties
      incomplete: false
    };
  }




  setEditor(editor) {
    this.editor = editor;
    if (editor.code)
      this.code = editor.code

    if (this.completionProvider) {
      this.completionProvider.dispose();
    }

    if (editor.objects) {

      this.completionProvider = monaco.languages.registerCompletionItemProvider('ljl', {
        provideCompletionItems: (model, position) => {
          const suggestions = this.convertObjectsToGroupSuggestions(editor.objects);
          return {
            suggestions: suggestions.suggestions,
            incomplete: suggestions.incomplete
          };
        },
        resolveCompletionItem: (item, token) => {
          // If the user is typing within a parameter placeholder, trigger property suggestions
          if (item.insertText.includes('${1:property}') || item.insertText.includes('${2:property}')) {
            const suggestions = this.convertObjectsToGroupSuggestions(editor.objects);

            // Return the function but let the user fill in the property
            return {
              insertText: item.insertText,
              label: item.label,
              kind: item.kind,
              documentation: item.documentation
            };
          }
          return item;
        }
      });
    }
    if (editor.onKeyUp) {
      editor.onKeyUp(LionEngine.ionfunctions[editor.onKeyUp])
    }
    if (editor.onDidChangeCursorPosition != null) {
      editor.onDidChangeCursorPosition((e) => {
        LionEngine.ionfunctions[editor.onDidChangeCursorPosition](this, e)
      })
    }
    if (editor.onDidFocusEditorWidget) {
      editor.onDidFocusEditorWidget(LionEngine.ionfunctions[editor.onDidFocusEditorWidget])
    }
    if (editor.onDidChangeCursorSelection) {
      editor.onDidChangeCursorSelection(LionEngine.ionfunctions[editor.onDidChangeCursorSelection])
    }
    if (editor.onMouseDown) {
      editor.onMouseDown(LionEngine.ionfunctions[editor.onMouseDown])
    }
    if (editor.nowrap)
      editor.updateOptions({ wordWrap: "on" })
    if (editor.theme) {
      editor.defineTheme('myTheme', editor.theme);
    }

    if (editor.height) {
      this.height = editor.height;
    }
    this.style = `height:${this.height}; width:95%; min-width:200px`
    if (editor.width) {
      this.style = `height:${this.height}; width:${editor.width}`
    }
    if (editor != null && editor._actions)
      this.fun = editor._actions['editor.action.formatDocument'];
    let waitv2 = setTimeout(() => {
      this.showEditor = true;
      if (this.fun)
        this.fun.run();
      clearTimeout(waitv2);
    }, 1500);
  }



  onInit(editor) {

    monaco.languages.register({ id: 'ljl' });
    monaco.languages.setMonarchTokensProvider('ljl', {
      tokenizer: {
        root: [
          [/\bTODO\b/, 'custom-todo'],
          [/[a-zA-Z_$][\w$]*/, 'identifier'],
          [/"/, 'string', '@string'],
        ],
        string: [
          [/[^"]+/, 'string'],
          [/"/, 'string', '@pop']
        ]
      }
    });


    if (this.data['objects']) {
      this.completionProvider = monaco.languages.registerCompletionItemProvider('ljl', {
        provideCompletionItems: (model, position) => {
          const suggestions = this.convertObjectsToGroupSuggestions(this.data['objects']);
          return {
            suggestions: suggestions.suggestions,
            incomplete: suggestions.incomplete
          };
        },
        resolveCompletionItem: (item, token) => {
          // If the user is typing within a parameter placeholder, trigger property suggestions
          if (item.insertText.includes('${1:property}') || item.insertText.includes('${2:property}')) {
            const suggestions = this.convertObjectsToGroupSuggestions(this.data['objects']);

            // Return the function but let the user fill in the property
            return {
              insertText: item.insertText,
              label: item.label,
              kind: item.kind,
              documentation: item.documentation
            };
          }
          return item;
        }
      });
      // Example usage
      //   monaco.languages.registerCompletionItemProvider('ljl', {
      //     provideCompletionItems: (model, position) => {
      //       // Get the suggestions from the method, assuming properties is an array of strings
      //       const suggestions = this.convertObjectsToGroupSuggestions(this.data['objects']);

      //       // Check if the cursor is inside a function parameter (i.e., user typing properties)
      //       const word = model.getWordUntilPosition(position);
      //       const range = {
      //         startLineNumber: position.lineNumber,
      //         endLineNumber: position.lineNumber,
      //         startColumn: word.startColumn,
      //         endColumn: word.endColumn
      //       };

      //       // Ensure that suggestions.properties is typed correctly as string[]
      //       return {
      //         suggestions: suggestions.properties.map((prop: string) => ({
      //           label: prop, // Since prop is a string (property name)
      //           kind: monaco.languages.CompletionItemKind.Property, // Define the kind as Property
      //           insertText: prop, // Insert the property name
      //           documentation: `Property: ${prop}`, // Provide basic documentation
      //           range: range // Ensure suggestions are inserted in the correct place
      //         }))
      //       };
      //     }
      //   });
    }


    if (this.data['onKeyUp']) {
      editor.onKeyUp(LionEngine.ionfunctions[this.data['onKeyUp']])
    }
    if (this.data['code']) {
      this.code = this.data['code']
    }
    if (this.data['text']) {
      this.code = this.data['text']
    }
    if (this.data['onDidChangeCursorPosition'] != null) {
      editor.onDidChangeCursorPosition((e) => {

        LionEngine.ionfunctions[this.data['onDidChangeCursorPosition']](this, e)
      })
    }
    if (this.data['onDidFocusEditorWidget']) {
      editor.onDidFocusEditorWidget(LionEngine.ionfunctions[this.data['onDidFocusEditorWidget']])
    }
    if (this.data['onDidChangeCursorSelection']) {
      editor.onDidChangeCursorSelection(LionEngine.ionfunctions[this.data['onDidChangeCursorSelection']])
    }
    if (this.data['onMouseDown']) {
      editor.onMouseDown(LionEngine.ionfunctions[this.data['onMouseDown']])
    }
    if (this.data['folderPath']) {
      this.folderPath = this.data['folderPath']
    }
    if (this.data['editable']) {
      this.editable = this.data['editable']
    }

    if (!this.data['nowrap'])
      editor.updateOptions({ wordWrap: "on" })



    if (this.data['theme']) {

      editor.defineTheme('myTheme', this.data['theme']);
    }

    if (this.data['height']) {
      this.height = this.data['height']
    }


    this.style = `height:${this.height}; width:95%; min-width:200px`


    if (this.data['width']) {

      this.style = `height:${this.height}; width:${this.data['width']}`
    }

    this.editor = editor;
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC,
      () => {
        editor.trigger('keyboard', 'editor.action.clipboardCopyAction', {});
      }
    );
    this.fun = editor._actions['editor.action.formatDocument'];
    let waitv2 = setTimeout(() => {
      if (this.fun)
        this.fun.run();
      clearTimeout(waitv2);
    }, 1500);
    let waitv = setTimeout(() => {
      if (this.fun)
        this.fun.run();
      clearTimeout(waitv);
    }, 1000);



    if (this.resolveFunction) {
      this.resolveFunction(this);
    }
  }
  async loadFile(file) {
    let client = await this.msgraph.getClient();
    let fol = await client.api(`/me/drive/items/${file.msid}`).get();
    let url = fol['@microsoft.graph.downloadUrl']
    // let json = await FunctionUtil.GETJSON(url)
    let txt = await FunctionUtil.GETXT(url);
    this.code = txt.toString();
    this.close();
  }
  layout() {

    this.zone.run(() => {
    })

    if (this.editor) {
      this.editor.layout();
    }
  }




  init(io: IoniScriptManager): string {
    this.io = io;
    if (this.data != null) {
      if (this.data['editorOptions'] != null) {
        this.editorOptions = this.data['editorOptions']
      }
      if (this.data['height'] != null) {
        this.height = this.data['height']
        // let h = this.data['height']
        // this.style = `height:${h}; width:95%`
      }
      if (this.data['mode'] != null) {
        this.mode = this.data['mode']
      }
      if (this.data['border'] != null) {
        this.border = this.data['border']
      }
      if (this.data['lineNumbers']) {
        this.editorOptions['lineNumbers'] = LionEngine.ionfunctions[this.data['lineNumbers']]
      }

      if (this.data['libs'] != null) {
        this.libs = this.data['libs']
        for (let lib of this.libs) {

        }
      }
    }
    if (this.resolveFunction) {
      this.resolveFunction(this);
    }

    return '';
  }

  getLines() {
    return this.code;
  }

  getText() {
    return this.code;
  }

  getContent(panel) {
    if (!panel)
      return this.code;
    if (panel === 'file') {
      return this.file_data;
    }
    else if (panel === 'io') {
      return this.getIO();
    } else {
      return this.code;
    }
  }


  setFileTitle(title) {
    this.file_title = title;
  }

  setContent(content) {
    this.code = content;
  }

  exec(...args) {
    let c = this.code.trim();
    let str = '';
    let objs = []
    for (let i of args) {
      str += i["name"] + ',';
      objs.push(i['object'])
    }
    if (str.endsWith(',')) {
      str = str.substring(0, str.length - 1)
    }
    for (let lib of this.libs) {
      c = `exec ('${lib['path']}').then ( async (${lib['name']}) => {
        ${c}
      })`
    }
    let code = `function (${str}) { 
      ${c}
    }`
    this.fg.exec(code, this.io, () => {
    }, objs)
  }

  appendCode(_code) {
    this.code += '\n' + _code;
  }


  execCode(_code, ...args) {
    let c = _code.trim();
    let str = '';
    let objs = []
    for (let i of args) {
      str += i["name"] + ',';
      objs.push(i['object'])
    }
    if (str.endsWith(',')) {
      str = str.substring(0, str.length - 1)
    }

    for (let lib of this.libs) {
      c = `exec ('${lib['path']}').then ( async (${lib['name']}) => {
        ${c}
      })`
    }

    let currentCode = `function (${str}) { 
      ${c}
    }`
    this.fg.exec(currentCode, this.io, () => {

    }, objs)
  }





  ngOnInit(): void {

    let waitv2 = setTimeout(() => {
      if (this.fun)
        this.fun.run();
      clearTimeout(waitv2);
    }, 1500);


    let waitv = setTimeout(() => {
      this.showEditor = true;
      this.initData = this.data;


      if (this.data["code"] != null) {
        this.code = this.data['code']
      }

      if (this.fun)
        this.fun.run();
      clearTimeout(waitv);
    }, 1000);

    if (this.resolveFunction) {
      this.resolveFunction(this)
    }


  }

}


