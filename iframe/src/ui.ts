/// <reference path="../../declaration/types.d.ts" />
import { EditorView, ViewUpdate, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { basicSetup } from "codemirror";
import { indentWithTab } from "@codemirror/commands";
import { Parser } from "@dbml/core";

import Helper from "../../widget/utils";

import { LanguageSupport } from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";

// Replaced by the widget to inject state
const INITIAL_DOC = ``;
const INITIAL_REF_DOC = `// Ref author_has_books:public.authors.id < public.books.author_id`;
const INITIAL_LANGUAGE = "JavaScript";
const TABLE_LIST = "$$$TABLE_LIST$$$" || [];

// The mapping from languages to CodeMirror packages
const LANGUAGES = [
  {
    name: "JavaScript",
    package: () => javascript({ jsx: true, typescript: true }),
  },
];

// Initialize the language
const languageObject = LANGUAGES.filter((x) => x.name === INITIAL_LANGUAGE)[0];
const language = languageObject.package();
const languageName = languageObject.name;

// const DEFAULT_STYLE: Style = {
//   color: "",
//   weight: "",
// };

createInfoText();
// create div with class name editor container and append it after p
const editorContainer = document.createElement("div");
editorContainer.className = "editor-container";
editorContainer.style.display = "flex";
editorContainer.style.flexDirection = "row";
editorContainer.style.width = "100%";
editorContainer.style.height = "100%";
// editorcontainer child width equaly divided
editorContainer.style.flex = "1";

const tableContainer = horizonContainer("table-container", { portion: 3 });
const existTableContainer = horizonContainer("exist-table-container", {
  portion: 1,
  align: "start",
  other: "height: 525px; border: 1px dashed gray;",
});
// const actionContainer = horizonContainer("action-container");

editorContainer.appendChild(tableContainer);

document.body.appendChild(editorContainer);

/**
 * Gets the CodeMirror editor extension configuration for the given languages
 * @param language The CodeMirror language package
 * @param languageName The name of the language package (see {@link LANGUAGES})
 * @returns CodeMirror extensions to power the editor
 */
function getExtensions(language: LanguageSupport, languageName: string) {
  // Cached styles

  return [
    // Essential setup
    [basicSetup, keymap.of([indentWithTab]), language],
    // Update function

    EditorView.updateListener.of((v: ViewUpdate) => {
      if (
        v.docChanged ||
        (v.transactions.length > 0 &&
          v.transactions.some((transaction) => transaction.reconfigured))
      ) {
        // on Document changed
        const docContents = v.state.doc.toString();

        let dbmlJSON: string | null = null;
        let dbmlError: string | null = null;

        try {
          const parseDbml = Parser.parse(docContents, "dbml");

          dbmlJSON = Helper.convertToJson(parseDbml);
        } catch (err) {
          dbmlError = err.message;
        }

        // The message to pass back to the widget
        const message: Message = {
          type: "text",
          text: docContents,
          dbml: dbmlJSON,
          dbmlError: dbmlError,
          language: languageName,
          buttonAction: "update",
        };

        returnMessage(parent, message);

        // Pass the message back to the widget
      } else {
        const docContents = v.state.doc.toString();

        let dbmlJSON: string | null = null;
        let dbmlError: string | null = null;
        let extraTable: string | null = null;

        try {
          if (TABLE_LIST.length > 0) {
            extraTable = (TABLE_LIST as SiblingTable[])
              .map((table: SiblingTable) => {
                const tName = (table.schemaName || 'public')  + "." + table.name;
                return `Table ${tName} { \n ${table.fields
                  .map((f) => f.name + " " + f.type)
                  .join("\n")} \n }`;
              })
              .join("\n");
          }

          const docWithExtraTable = [docContents,extraTable].join('\n');

          const parseDbml = Parser.parse(docWithExtraTable, "dbml");

          dbmlJSON = Helper.convertToJson(parseDbml);

        } catch (err) {
          dbmlError = err.message;
        }

        returnMessage(parent, {
          type: "text",
          text: docContents,
          dbml: dbmlJSON,
          dbmlError: dbmlError,
          language: languageName,
          buttonAction: "update",
        });
      }
    }),
  ];
}

const returnMessage = (parent, message) => {
  document.onkeydown = function (event) {
    const theEvent: any = event || window.event;
    var isEscape = false;
    if ("key" in theEvent) {
      isEscape = theEvent.key === "Escape" || theEvent.key === "Esc";
    } else {
      isEscape = theEvent.keyCode === 27;
    }

    if (isEscape) {
      parent.postMessage(
        {
          pluginMessage: message,
        },
        "*"
      );
    }
  };
};

// Create the CodeMirror editor
const editor = new EditorView({
  state: EditorState.create({
    doc: "$$$INITIAL_DOC$$$", // INITIAL_DOC replaced by the widget to inject state
    extensions: getExtensions(language, languageName),
  }),
  parent: tableContainer,
});
editor.focus();

// createRefEditor();
renderExistTableList(existTableContainer);
editorContainer.appendChild(existTableContainer);

editor.dom.style.width = "100%";
editor.dom.style.height = "90%";
editor.dom.style.border = "0.2px solid gray";

// generateAction(actionContainer);

// editorContainer.appendChild(actionContainer);

// const convertToJson = (dbml): string | null => {
//   // let dbmlResponse = []
//   // loop through schemas and tables and create new json name, notes, columns, and relationships

//   const dbmlResponse = dbml.schemas.map((schema) => {
//     const { name: schemaName, note: schemaNote } = schema;
//     const newSchema: SchemaResponse = {
//       name: schemaName,
//       note: schemaNote,

//       tables: schema.tables.map((table) => {
//         const newTable: TableResponse = {
//           name: table.name,
//           alias: table.alias,
//           note: table.note,
//           fields: table.fields.map((field) => {
//             const newField: FieldResponse = {
//               name: field.name,
//               pk: field.pk,
//               type: field.type.type_name,
//               fieldDefault: field.dbdefault,
//               not_null: field.not_null,
//               unique: field.unique,
//               note: field.note,
//             };
//             return newField;
//           }),
//         };

//         return newTable;
//       }),
//       enums: schema.enums.map((enumItem) => {
//         const newEnum: EnumResponse = {
//           name: enumItem.name,
//           values: enumItem.values.map((value) => {
//             const newValue: EnumValueResponse = {
//               id: value.id,
//               name: value.name,
//               note: value.note,
//             };
//             return newValue;
//           }),
//         };
//         return newEnum;
//       }),
//       refs: schema.refs.map((ref) => {
//         const fromEnd = ref.endpoints[0];
//         const toEnd = ref.endpoints[1];
//         const fromEndString = [
//           fromEnd.schemaName,
//           fromEnd.tableName,
//           fromEnd.fieldNames,
//           fromEnd.relation,
//         ].join('|')

//         const toEndString = [
//           toEnd.schemaName,
//           toEnd.tableName,
//           toEnd.fieldNames,
//           toEnd.relation,
//         ].join("|");
//         const newRef: RefResponse = {
//           id: ref.id,
//           name: ref.name,
//           from: {
//             schema: fromEnd.schemaName,
//             table: fromEnd.tableName,
//             relation: fromEnd.relation,
//             fieldNames: fromEnd.fieldNames,
//           },
//           to: {
//             schema: toEnd.schemaName,
//             table: toEnd.tableName,
//             relation: toEnd.relation,
//             fieldNames: toEnd.fieldNames,
//           },
//           refDef: [fromEndString, toEndString].join("~"),
//         };
//         return newRef;
//       }),
//     };
//     return newSchema;
//   });
//   return JSON.stringify(dbmlResponse as SchemaResponse);
// };

function horizonContainer(
  className: string = "container-name",
  extra: { portion?: number; align?: "center" | "start"; other?: string } = {
    portion: 1,
    align: "center",
    other: "",
  }
) {
  const { portion, align, other = "" } = extra;

  const container = document.createElement("div");
  container.classList.add(className);
  container.style.width = "100%";
  container.style.height = "100%";
  container.style.paddingLeft = "5px";
  container.style.paddingRight = "5px";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.alignItems = align;
  container.style.flex = portion.toString();
  container.style.overflow = "scroll";
  container.style.cssText = container.style.cssText + other;
  return container;
}

function generateButton(text: string = "Batch Table") {
  const button = document.createElement("div");
  button.style.width = "fit-content";
  button.style.height = "50px";
  button.style.backgroundColor = "coral";
  button.style.color = "white";
  button.style.display = "flex";
  button.style.justifyContent = "center";
  button.style.alignItems = "center";
  button.style.cursor = "pointer";
  button.style.borderRadius = "5px";
  button.style.paddingLeft = "5px";
  button.style.paddingRight = "5px";
  button.style.margin = "5px";

  button.innerHTML = text;
  return button;
}

function createInfoText() {
  const infoText = document.createElement("p");
  infoText.innerHTML = "Press ESC to exit code editor";
  document.body.appendChild(infoText);
}

function renderExistTableList(existTableContainer) {
  const availableTable = document.createElement("ul");
  const fontSize =18;
  availableTable.style.paddingLeft = '20px';
  if (TABLE_LIST.length > 0) {
    (TABLE_LIST as SiblingTable[]).forEach((table: SiblingTable) => {
      const li = document.createElement("li");

      const span = document.createElement("span")
      span.innerHTML = table.schemaName + "." + table.name;
      li.innerHTML =  span.outerHTML;

      const fieldUl = document.createElement("ul");
      fieldUl.style.paddingLeft = '10px';

      const tableField = table.fields || [];
      tableField.forEach((field) => {
        const fieldLi = document.createElement("li");
        fieldLi.innerHTML =  field.name;

        fieldUl.appendChild(fieldLi);
      });

      li.appendChild(fieldUl);
      availableTable.appendChild(li);
    });
  }
  existTableContainer.appendChild(availableTable);
}

// function createRefEditor() {
//   const refEditor = new EditorView({
//     state: EditorState.create({
//       doc: "$$$INITIAL_REF_DOC$$$", // INITIAL_DOC replaced by the widget to inject state
//       extensions: getExtensions(language, languageName),
//     }),
//     // parent: refContainer,
//   });
//   refEditor.dom.style.width = "100%";
//   refEditor.dom.style.height = "100%";
//   refEditor.dom.style.border = "0.2px solid gray";
// }

// function generateAction(actionContainer) {
//   const batchCreateButton = generateButton("Generate All Table");
//   batchCreateButton.addEventListener("click", () => {
//     const docContents = editor.state.doc.toString();

//     let dbmlJSON: string | null = null;
//     let dbmlError: string | null = null;

//     try {
//       const parseDbml = Parser.parse(docContents, "dbml");

//       // dbmlJSON = convertToJson(parseDbml);
//     } catch (err) {
//       dbmlError = err.message;
//     }

//     const message: Message = {
//       type: "text",
//       text: docContents,
//       dbml: dbmlJSON,
//       dbmlError: dbmlError,
//       language: languageName,
//       buttonAction: "batch_create",
//     };

//     returnMessage(parent, message);
//   });
//   const connectRefButton = generateButton("Connect Ref");

//   actionContainer.appendChild(batchCreateButton);
//   actionContainer.appendChild(connectRefButton);
// }

// Listen to dropdown change events and update the editor with a new extension
// configuration based on the selected language

// dropdown.addEventListener("change", (e) => {
//   // Grab the language name and package
//   const languageName = (e.target as HTMLSelectElement).value;
//   const languagePackage = LANGUAGES.filter((x) => x.name === languageName)[0]
//     .package;
//   // Update the editor
//   editor.dispatch({
//     effects: StateEffect.reconfigure.of(
//       getExtensions(languagePackage(), languageName)
//     ),
//   });
// });
