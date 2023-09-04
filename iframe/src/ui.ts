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
const INITIAL_LANGUAGE = "JavaScript";

// The mapping from languages to CodeMirror packages
const LANGUAGES = [
  {
    name: "JavaScript",
    package: () => javascript({ jsx: true, typescript: true }),
  },
];

// Initialize the language
const languageObject = LANGUAGES.filter(
  (x) => x.name === "$$$INITIAL_LANGUAGE$$$"
)[0]; // INITIAL_LANGUAGE replaced by the widget to inject state
const language = languageObject.package();
const languageName = languageObject.name;

const DEFAULT_STYLE: Style = {
  color: "",
  weight: "",
};

const p = document.createElement("p");
p.innerHTML = "Press ESC to exist code editor";
document.body.appendChild(p);

/**
 * Gets the CodeMirror editor extension configuration for the given languages
 * @param language The CodeMirror language package
 * @param languageName The name of the language package (see {@link LANGUAGES})
 * @returns CodeMirror extensions to power the editor
 */
function getExtensions(language: LanguageSupport, languageName: string) {
  // Cached styles
  const STYLE_CACHE: { [style: string]: Style } = {};

  /**
   * Gets the style given a CodeMirror highlight class
   * @param className The CodeMirror class name
   * @returns A style object with computed styles based on the iframe DOM
   */
  function getStyle(className: string): Style {
    // Check if the style is cached to avoid unnecessary computation
    if (STYLE_CACHE[className] != null) {
      return STYLE_CACHE[className];
    }

    // Create a temporary element
    const tmpElem = document.createElement("div");
    tmpElem.className = className;
    document.body.appendChild(tmpElem);
    // Update the cache with the computed style
    const computed = getComputedStyle(tmpElem);
    STYLE_CACHE[className] = {
      color: computed.color,
      weight: computed.fontWeight,
    };
    document.body.removeChild(tmpElem);

    // Return getStyle, which will retrieve from cache now
    return getStyle(className);
  }

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
        // Document changed
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
        };

        returnMessage(parent, message);

        // Pass the message back to the widget
      } else {
        const docContents = v.state.doc.toString();

        let dbmlJSON: string | null = null;
        let dbmlError: string | null = null;

        try {
          dbmlJSON = Helper.convertToJson(parseDbml);

          dbmlJSON = convertToJson(parseDbml);
        } catch (err) {
          dbmlError = err.message;
        }

        returnMessage(parent, {
          type: "text",
          text: docContents,
          dbml: dbmlJSON,
          dbmlError: dbmlError,
          language: languageName,
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
  parent: document.body,
});
editor.focus();

const convertToJson = (dbml): string | null => {
  // let dbmlResponse = []
  // loop through schemas and tables and create new json name, notes, columns, and relationships

  const dbmlResponse = dbml.schemas.map((schema) => {
    const { name: schemaName, note: schemaNote } = schema;
    const newSchema: SchemaResponse = {
      name: schemaName,
      note: schemaNote,

      tables: schema.tables.map((table) => {
        const newTable: TableResponse = {
          name: table.name,
          alias: table.alias,
          note: table.note,
          fields: table.fields.map((field) => {
            const newField: FieldResponse = {
              name: field.name,
              pk: field.pk,
              type: field.type.type_name,
              fieldDefault: field.dbdefault,
              not_null: field.not_null,
              unique: field.unique,
              note: field.note,
            };
            return newField;
          }),
        };

        return newTable;
      }),
      enums: schema.enums.map((enumItem) => {
        const newEnum: EnumResponse = {
          name: enumItem.name,
          values: enumItem.values.map((value) => {
            const newValue: EnumValueResponse = {
              id: value.id,
              name: value.name,
              note: value.note,
            };
            return newValue;
          }),
        };
        return newEnum;
      }),
      refs: schema.refs.map((ref) => {
        const newRef: RefResponse = {
          id: ref.id,
          name: ref.name,
          from: {
            schema: ref.endpoints[0].schemaName,
            table: ref.endpoints[0].tableName,
            relationship: ref.endpoints[0].relation,
            fieldNames: ref.endpoints[0].fieldNames,
          },
          to: {
            schema: ref.endpoints[1].schemaName,
            table: ref.endpoints[1].tableName,
            relationship: ref.endpoints[1].relation,
            fieldNames: ref.endpoints[1].fieldNames,
          },
        };
        return newRef;
      }),
    };
    return newSchema;
  });
  return JSON.stringify(dbmlResponse as SchemaResponse);
};

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
