/// <reference path="../../declaration/types.d.ts" />
// This widget will open an Iframe window with buttons to show a toast message and close the window.
const { widget } = figma;
const {
  useEffect,
  Text,
  Frame,
  AutoLayout,
  useSyncedState,
  useSyncedMap,
  usePropertyMenu,
  useWidgetId,
} = widget;

const defaultHeaderColors = [
  { option: "#F24822", tooltip: "Red" },
  { option: "#FFA629", tooltip: "Orange" },
  { option: "#FFCD29", tooltip: "Yellow" },
  { option: "#14AE5C", tooltip: "Green" },
  { option: "#0D99FF", tooltip: "Blue" },
  { option: "#9747FF", tooltip: "Violet" },
  { option: "#FFC7C2", tooltip: "Light red" },
  { option: "#FCD19C", tooltip: "Light orange" },
  { option: "#FFE8A3", tooltip: "Light yellow" },
  { option: "#AFF4C6", tooltip: "Light green" },
  { option: "#BDE3FF", tooltip: "Light blue" },
  { option: "#E4CCFF", tooltip: "Light violet" },
  { option: "#FFF8E7", tooltip: "Cosmic Latte" },
];

const PLACEHOLDER = "rgb(128, 128, 128)";
const FONT_FAMILY = "Source Code Pro";
const PLACEHOLDER_TEXT = `Table table_name{
  id int [pk]
  created_at timestamp
  updated_at timestamp
}
`;
const SAMPLE_TABLE = {
  name: "table_name",
  note: "This is a sample table",
  alias: null,
  schemaName: "public",
  fields: [
    {
      name: "id",
      type: "int",
      pk: true,
    },
    {
      name: "created_at",
      type: "timestamp",
    },
    {
      name: "updated_at",
      type: "timestamp",
    },
  ],
};

const startColor: HexCode =
  defaultHeaderColors[Math.floor(Math.random() * defaultHeaderColors.length)]
    .option;

interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

function placeholderTokens(
  placeholderText: string,
  language?: string
): Message {
  const tokens: Token[] = [];
  let x = 0;
  let y = 0;
  let width = 0;
  for (let i = 0; i < placeholderText.length; i++) {
    const text = placeholderText.charAt(i);

    tokens.push({
      i,
      x,
      y,
      text,
      style: {
        color: PLACEHOLDER,
        weight: "normal",
      },
    });

    if (text === "\n") {
      x = 0;
      y++;
    } else {
      x++;
      if (x > width) {
        width = x;
      }
    }
  }

  const height = y + 1;
  return {
    type: "text",
    width,
    height,
    text: placeholderText,
    tokens,
    dbml: JSON.stringify(SAMPLE_TABLE),
    dbmlError: null,
    language: language == null ? "JavaScript" : language,
  };
}

// create promise function to trigger showUI
function showUI(text = "") {
  const injectedHtml = __html__
    .replace(/['"]\$\$\$INITIAL_DOC\$\$\$['"]/, JSON.stringify(text))
    .replace(
      /['"]\$\$\$INITIAL_LANGUAGE\$\$\$['"]/,
      JSON.stringify("JavaScript")
    );

  figma.showUI(injectedHtml, { width: 500, height: 300 });
}

function Widget() {
  const widgetId = useWidgetId();
  const [color, setColor] = useSyncedState("theme", startColor);

  // const [siblings, setSiblings] = useSyncedState("siblings", {});
  const [tableDef, setTableDef] = useSyncedState("tableDef", PLACEHOLDER_TEXT);
  const [table, setTable] = useSyncedState("table", SAMPLE_TABLE);
  const [dbmlState, setDbmlState] = useSyncedState("dbml", {});

  const [FONT_SIZE, setFontSize] = useSyncedState("fontSize", 24);
  const [colorMode, setColorMode] = useSyncedState("colorMode", "light");
  const [includeFrame, setIncludeFrame] = useSyncedState("includeFrame", false);
  // const LETTER_WIDTH = FONT_SIZE * 0.6;
  // const LETTER_HEIGHT = (FONT_SIZE / 24) * 30;
  const PADDING = (FONT_SIZE / 24) * 10;
  const CORNER_RADIUS = (FONT_SIZE / 24) * 8;
  const BACKGROUND = colorMode === "light" ? "#FFFFFF" : "#343434";

  usePropertyMenu(
    [
      {
        itemType: "color-selector",
        propertyName: "color",
        tooltip: "Color selector",
        selectedOption: color,
        options: defaultHeaderColors,
      },
      {
        itemType: "action",
        tooltip: "Edit",
        propertyName: "edit",
      },
    ],
    ({ propertyName, propertyValue }) => {
      if (propertyName === "edit") {
        return new Promise((resolve) => {
          showUI(tableDef);
        });
      }

      if (propertyName === "color") {
        setColor(propertyValue);
      }
    }
  );

  useEffect(() => {
    figma.ui.onmessage = (msg: Message) => {
      if (msg.type === "text") {
        figma.closePlugin();
        if (msg.dbmlError != null) {
          setTableDef(msg.text);
          return figma.notify(msg.dbmlError, { timeout: 5000 });
        }

        if (msg.dbml === dbmlState) return;

        if (msg.text === "") {
          // setTokens(placeholderTokens(PLACEHOLDER_TEXT, msg.language));
          setTable(SAMPLE_TABLE);
        } else {
          const currentNode = figma.getNodeById(widgetId) as WidgetNode;
          const dbmlTable = extractTables(msg.dbml)[0];

          setTable(dbmlTable);
          setTableDef(msg.text);

          currentNode.setSharedPluginData('dbmlTable', 'tableDef', msg.text)
          // informAllSiblings(figma.widgetId, siblings);
          setDbmlState(msg.dbml);
          // setTokens(msg);
        }
      }
    };
  });

  const component = (
    <AutoLayout padding={10} key={table.name}>
      <Table
        schema={{ name: table.schemaName || "public" }}
        table={table}
        tableSpec={{ color: color, fontSize: FONT_SIZE, padding: PADDING }}
      />
    </AutoLayout>
  );
    return component;

}

function Table(props: {
  schema: SchemaResponse;
  table: any;
  tableSpec: { fontSize: number; color: string; padding: any };
}) {
  const {
    schema: { name: schemaName },
    table: { name, fields, note },
    tableSpec: { fontSize, color, padding },
  } = props;
  const displayTableName =
    schemaName === "public" ? name : [schemaName, name].join(".");
  const COLUMN_FONT_SIZE = fontSize * 0.8;
  return (
    <AutoLayout direction="vertical" padding={padding}>
      <AutoLayout
        width={500}
        height={48}
        cornerRadius={{
          topLeft: 16,
          topRight: 16,
        }}
        fill={color}
        padding={{ horizontal: 16 }}
        horizontalAlignItems="center"
        verticalAlignItems="center"
      >
        <Text
          width="fill-parent"
          fontWeight={500}
          horizontalAlignText="center"
          verticalAlignText="center"
          fontFamily={FONT_FAMILY}
          fontSize={fontSize}
        >
          {displayTableName}
        </Text>
        {note && (
          <AutoLayout tooltip={note}>
            <Text
              fontSize={fontSize}
              fontFamily="Font Awesome 6 Free"
              fontWeight={900}
              fill={"#000000"}
              verticalAlignText="center"
            >
              {"note-sticky"}
            </Text>
          </AutoLayout>
        )}
      </AutoLayout>
      {fields.map((field, key) => (
        <Column
          key={field.name + key}
          fontSize={COLUMN_FONT_SIZE}
          column={field}
        />
      ))}
    </AutoLayout>
  );
}

function Column(props: { fontSize: number; column: FieldResponse }) {
  const {
    column: { name, type, pk, note, not_null, unique, fieldDefault },
    fontSize,
  } = props;

  const displayNote = note ? "Note: " + note : "";
  const displayDefaultValue =
    fieldDefault && fieldDefault.value ? "Default: " + fieldDefault.value : "";
  const colTooltip = [displayNote, displayDefaultValue]
    .filter(Boolean)
    .join("\n");

  const icon = pk ? "key" : unique ? "asterisk" : "";
  const iconColor = pk ? "#FFE800" : unique ? "#3498db" : "";
  const iconToolTip = pk ? "Primary Key" : unique ? "Unique" : "";
  return (
    <AutoLayout
      width={500}
      height={48}
      padding={{
        right: 16,
        left: 18,
      }}
      stroke="#e6e6e6"
      fill={"#ffffff"}
      verticalAlignItems="center"
      horizontalAlignItems="center"
    >
      {!!icon ? (
        <AutoLayout
          padding={{
            right: 5,
          }}
          tooltip={iconToolTip}
        >
          <Text
            fontSize={fontSize}
            fontFamily="Font Awesome 6 Free"
            fontWeight={900}
            fill={iconColor}
            verticalAlignText="center"
          >
            {icon}
          </Text>
        </AutoLayout>
      ) : null}
      <Text width="fill-parent" fontFamily="Roboto Mono" fontSize={fontSize}>
        {name + (not_null === undefined ? "" : not_null ? "" : "?")}
      </Text>

      <Text fontFamily="Roboto Mono" fontSize={fontSize}>
        {type}
      </Text>
      {(note || fieldDefault) && (
        <AutoLayout
          padding={{
            left: 5,
          }}
          tooltip={colTooltip}
        >
          <Text
            fontSize={fontSize}
            fontFamily="Font Awesome 6 Free"
            fontWeight={900}
            fill={"#000000"}
            verticalAlignText="center"
          >
            {"note-sticky"}
          </Text>
        </AutoLayout>
      )}
    </AutoLayout>
  );
}

function informAllSiblings(widgetId, siblings) {
  figma.currentPage.findWidgetNodesByWidgetId(widgetId).forEach((n) => {
    if (Object.keys(siblings).indexOf(n.id) >= 0) {
      n.setWidgetSyncedState({ siblings: siblings });
    }
  });
}

function extractTables(dbml: string) {
  const schemas = JSON.parse(dbml);
  const tables = [];

  for (let index = 0; index < schemas.length; index++) {
    const schema = schemas[index];
    for (let index = 0; index < schema.tables.length; index++) {
      const table = schema.tables[index];
      tables.push({ ...table, schemaName: schema.name });
    }
  }

  return tables;
}

widget.register(Widget);
