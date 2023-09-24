/// <reference path="../../declaration/types.d.ts" />
// This widget will open an Iframe window with buttons to show a toast message and close the window.
const { widget } = figma;

// const Helper = require("../utils");
import Helper from "../utils";
const {
  useEffect,
  Text,
  Frame,
  AutoLayout,
  useSyncedState,
  usePropertyMenu,
  useWidgetId,
} = widget;

const WIDGET_NAME = "DBML";
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

const PLACEHOLDER_TEXT = `Table table_name{
  id int [pk]
  created_at timestamp
  updated_at timestamp
}
`;

const FONT_FAMILY = "Source Code Pro";

const DEFAULT_HEADER_COLOR = [
  { option: "#FFA629", tooltip: "Orange" },
  { option: "#FFCD29", tooltip: "Yellow" },
  { option: "#FFC7C2", tooltip: "Light red" },
  { option: "#FCD19C", tooltip: "Light orange" },
  { option: "#FFE8A3", tooltip: "Light yellow" },
  { option: "#AFF4C6", tooltip: "Light green" },
  { option: "#BDE3FF", tooltip: "Light blue" },
  { option: "#E4CCFF", tooltip: "Light violet" },
  { option: "#FFF8E7", tooltip: "Cosmic Latte" },
  { option: "#78e08f", tooltip: "Aurora" },
  { option: "#b8e994", tooltip: "Paradise" },
];

const PLACEHOLDER = "rgb(128, 128, 128)";

const startColor: HexCode =
  defaultHeaderColors[Math.floor(Math.random() * defaultHeaderColors.length)]
    .option;

interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
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

  const [showNote, setShowNote] = useSyncedState("showNote", true);
  const [tableDef, setTableDef] = useSyncedState("tableDef", PLACEHOLDER_TEXT); // use for store string display on edit
  const [dbml, setDbml] = useSyncedState("dbml", "");
  const [table, setTable] = useSyncedState("table", SAMPLE_TABLE); // use to hold table object
  const [FONT_SIZE, setFontSize] = useSyncedState("fontSize", 24);
  // const [colorMode, setColorMode] = useSyncedState("colorMode", "light");
  // const LETTER_WIDTH = FONT_SIZE * 0.6;
  // const LETTER_HEIGHT = (FONT_SIZE / 24) * 30;
  const PADDING = (FONT_SIZE / 24) * 10;

  // const toggleShowNoteButt = (showNote ? "Hide note" : "Show note");
  usePropertyMenu(
    [
      {
        itemType: "action",
        tooltip: "Add",
        propertyName: "add",
      },
      {
        itemType: "action",
        tooltip: "Connect",
        propertyName: "connect",
      },
      { itemType: "separator" },
      {
        itemType: "color-selector",
        propertyName: "color",
        tooltip: "Color selector",
        selectedOption: color,
        options: DEFAULT_HEADER_COLOR,
      },
      {
        itemType: "action",
        tooltip: "Toggle Note",
        propertyName: "toggleShowNote",
      },
      { itemType: "separator" },
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
      if (propertyName === "toggleShowNote") {
        setShowNote(!showNote);
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
          setTable(SAMPLE_TABLE);
        } else {
          const currentNode = figma.getNodeById(widgetId) as WidgetNode;
          const dbmlTable = extractTables(msg.dbml)[0];

          setTable(dbmlTable);
          setTableDef(msg.text);

          currentNode.setSharedPluginData("dbmlTable", "tableDef", msg.text);

          setDbmlState(msg.dbml);
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
        showNote={showNote}
      />
    </AutoLayout>
  );
  return component;
}

function renderRef(refJson, siblings) {
  const foundSibNodes = figma.currentPage.findAll(
    (n) => siblings.includes(n.id) && n.type === "WIDGET"
  );
  refJson.forEach((ref) => {
    const sourceTable = ref.from;
    const targetTable = ref.to;

    let sourceTableNode, targetTableNode = undefined;
    foundSibNodes.forEach((n: WidgetNode) => {
      const nTable = n.widgetSyncedState["table"];
      if (nTable.name === sourceTable.table && nTable.schemaName === sourceTable.schema) {
        sourceTableNode = n;
      }
      if (nTable.name === targetTable.table && nTable.schemaName === targetTable.schema) {
        targetTableNode = n;
      }
    })

    if (sourceTableNode == undefined || targetTableNode == undefined) return;
    const sourceTableId = sourceTableNode.id;
    const targetTableId = targetTableNode.id;

    // find connector with same source and target if exists dont draw


    const existingConnector = figma.currentPage.findOne(
      (n) =>
        n.type === "CONNECTOR" && n.getPluginData("dbmlTableRef") === ref.refDef
    );

    if (existingConnector) {
      return;
    }

    const connector = figma.createConnector();
    connector.connectorStart = {
      endpointNodeId: sourceTableId,
      magnet: "RIGHT",
    };
    connector.connectorEnd = {
      endpointNodeId: targetTableId,
      magnet: "LEFT",
    };

    connector.connectorStartStrokeCap =
      sourceTable.relation == "1" ? "NONE" : "ARROW_LINES";

    connector.connectorEndStrokeCap =
      targetTable.relation == "1" ? "NONE" : "ARROW_LINES";

    connector.setPluginData("dbmlTableRef", ref.refDef);
  });
}

function informAllSiblings(currentNode, cloneNodeId, parentId) {
  // inform current sibling nodes of new sibling id
  const { id: uniqueNodeId, widgetId: widgetTypeId } = currentNode;

  let uniqueSiblingIds = [];
  figma.currentPage.findWidgetNodesByWidgetId(widgetTypeId).forEach((n) => {
    if (n == undefined) return; // if node is deleted
    const nParentId = n.getSharedPluginData("dbmlTable", "parentId");
    if (nParentId !== parentId) return; // if node is not sibling
    let ids = n.getSharedPluginData("dbmlTable", "siblings") || "";
    const siblings = ids ? JSON.parse(ids) : [];
    uniqueSiblingIds = [...new Set([...siblings, uniqueNodeId, cloneNodeId])];

    n.setSharedPluginData(
      "dbmlTable",
      "siblings",
      JSON.stringify(uniqueSiblingIds)
    );
  });

  return uniqueSiblingIds;
}

function getTableDataBySiblings(siblings, selfId) {
  if (!siblings) {
    return [];
  }
  const sibIds = JSON.parse(siblings);
  const filteredSibIds = sibIds.filter((sibId) => sibId !== selfId);

  const tableData = filteredSibIds
    .map((siblingId) => {
      const siblingNode = figma.getNodeById(siblingId) as WidgetNode;
      if (!siblingNode) return; // if node is deleted
      const sib = siblingNode.widgetSyncedState["table"];
      const sibWithId = { ...sib, uniqueNodeId: siblingId };
      return sibWithId;
    })
    .filter(Boolean);
  return tableData;
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

function extractRef(dbml: string) {
  const schemas = JSON.parse(dbml);
  const refs = [];

  for (let index = 0; index < schemas.length; index++) {
    const schema = schemas[index];
    for (let index = 0; index < schema.refs.length; index++) {
      const ref = schema.refs[index];
      refs.push(ref);
    }
  }

  return refs;
}

function positionCloneAndConnector(currentNode, clonedNode) {
  const oneToOneConnector = figma.createConnector();
  oneToOneConnector.connectorStart = {
    endpointNodeId: currentNode.id,
    magnet: "BOTTOM",
  };
  oneToOneConnector.connectorEnd = {
    endpointNodeId: clonedNode.id,
    magnet: "TOP",
  };

  clonedNode.x = currentNode.x;
  clonedNode.y += currentNode.height + 40;
  figma.currentPage.appendChild(clonedNode);
}

function Table(props: {
  schema: SchemaResponse;
  table: any;
  tableSpec: { fontSize: number; color: string; padding: any };
  showNote: boolean;
}) {
  const {
    schema: { name: schemaName },
    table: { name, fields, note },
    tableSpec: { fontSize, color, padding },
    showNote,
  } = props;
  const displayTableName =
    schemaName === "public" ? name : [schemaName, name].join(".");
  const COLUMN_FONT_SIZE = fontSize * 0.8;

  return (
    <AutoLayout direction="vertical" padding={padding}>
      <AutoLayout
        width={500}
        // height={48}
        direction="vertical"
        cornerRadius={{
          topLeft: 16,
          topRight: 16,
        }}
        fill={color}
        padding={{ horizontal: 16, vertical: 6 }}
        horizontalAlignItems="center"
        verticalAlignItems="center"
        tooltip={note}
      >
        <AutoLayout width="fill-parent">
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
            <AutoLayout padding={{ vertical: 6 }}>
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
        {showNote && note && (
          <Text fill={"#777777"} fontFamily="Roboto Mono">
            {" "}
            {note}{" "}
          </Text>
        )}
      </AutoLayout>
      {fields.map((field, key) => (
        <Column
          key={field.name + key}
          fontSize={COLUMN_FONT_SIZE}
          column={field}
          showNote={showNote}
        />
      ))}
    </AutoLayout>
  );
}

function Column(props: {
  fontSize: number;
  column: FieldResponse;
  showNote: boolean;
}) {
  const {
    column: { name, type, pk, note, not_null, unique, fieldDefault },
    fontSize,
    showNote,
  } = props;

  const displayNote = note ? note : "";
  const displayDefaultValue =
    fieldDefault && fieldDefault.value ? "Default: " + fieldDefault.value : "";
  const colTooltip = [displayNote, displayDefaultValue]
    .filter(Boolean)
    .join("\n");

  const leftIcon = pk ? "key" : unique ? "asterisk" : "";
  const leftIconColor = pk ? "#FFE800" : unique ? "#3498db" : "";
  const leftIconToolTip = pk ? "Primary Key" : unique ? "Unique" : "";

  const DEFAULT_COL_HEIGHT = 48;
  const hasNote = note || fieldDefault;
  // const colHeight =
  //   showNote && hasNote ? DEFAULT_COL_HEIGHT * 2 : DEFAULT_COL_HEIGHT;
  return (
    <AutoLayout
      width={500}
      // height={colHeight}
      direction="vertical"
      padding={{
        right: 16,
        left: 18,
        top: 10,
        bottom: 10,
      }}
      stroke="#e6e6e6"
      fill={"#ffffff"}
      tooltip={colTooltip}
    >
      <AutoLayout
        width="fill-parent"
        verticalAlignItems="center"
        horizontalAlignItems="center"
      >
        {!!leftIcon ? (
          <AutoLayout
            padding={{
              right: 5,
              horizontal: 6,
            }}
          >
            <Text
              fontSize={fontSize}
              fontFamily="Font Awesome 6 Free"
              fontWeight={900}
              fill={leftIconColor}
              verticalAlignText="center"
              tooltip={leftIconToolTip}
            >
              {leftIcon}
            </Text>
          </AutoLayout>
        ) : null}
        <Text width="fill-parent" fontFamily="Roboto Mono" fontSize={fontSize}>
          {name + (not_null === undefined ? "" : not_null ? "" : "?")}
        </Text>

        <Text fontFamily="Roboto Mono" fontSize={fontSize} fill={"#777777"}>
          {type}
        </Text>
        {(note || fieldDefault) && (
          <AutoLayout
            padding={{
              left: 5,
            }}
          >
            <Text
              fontSize={fontSize}
              fontFamily="Font Awesome 6 Free"
              fontWeight={900}
              fill={"#777777"}
              verticalAlignText="center"
            >
              {"note-sticky"}
            </Text>
          </AutoLayout>
        )}
      </AutoLayout>
      {showNote && hasNote && (
        <AutoLayout padding={{ left: 5 }}>
          <Text fill={"#777777"} fontFamily="Roboto Mono">
            {" "}
            {colTooltip}{" "}
          </Text>
        </AutoLayout>
      )}
    </AutoLayout>
  );
}

widget.register(Widget);
