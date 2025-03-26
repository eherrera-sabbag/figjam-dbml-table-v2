export const SAMPLE_TABLE = {
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
      name: "active",
      type: "bool",
      fieldDefault: "1"
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

export const PLACEHOLDER_TEXT = `Table table_name{
  id int [pk]
  active bool [not null, default: "1"]
  created_at timestamp
  updated_at timestamp
}
`;

export const FONT_FAMILY = "Source Code Pro";

export const DEFAULT_HEADER_COLOR = [
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
  { option: "#1F41AC", tooltip: "Cobalt Blue" },
];
