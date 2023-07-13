const { widget: { Text, AutoLayout }, } = figma;
import Column from "./column";
import { FONT_FAMILY } from "./default-data";
export default function Table(props) {
    const { schema: { name: schemaName }, table: { name, fields, note }, tableSpec: { fontSize, color, padding }, showNote, } = props;
    const displayTableName = schemaName === "public" ? name : [schemaName, name].join(".");
    const COLUMN_FONT_SIZE = fontSize * 0.8;
    return (figma.widget.h(AutoLayout, { direction: "vertical", padding: padding },
        figma.widget.h(AutoLayout, { width: 500, 
            // height={48}
            direction: "vertical", cornerRadius: {
                topLeft: 16,
                topRight: 16,
            }, fill: color, padding: { horizontal: 16, vertical: 6 }, horizontalAlignItems: "center", verticalAlignItems: "center", tooltip: note },
            figma.widget.h(AutoLayout, { width: "fill-parent" },
                figma.widget.h(Text, { width: "fill-parent", fontWeight: 500, horizontalAlignText: "center", verticalAlignText: "center", fontFamily: FONT_FAMILY, fontSize: fontSize }, displayTableName),
                note && (figma.widget.h(AutoLayout, { padding: { vertical: 6 } },
                    figma.widget.h(Text, { fontSize: fontSize, fontFamily: "Font Awesome 6 Free", fontWeight: 900, fill: "#000000", verticalAlignText: "center" }, "note-sticky")))),
            showNote && note && (figma.widget.h(Text, { fill: "#777777", fontFamily: "Roboto Mono" },
                " ",
                note,
                " "))),
        fields.map((field, key) => (figma.widget.h(Column, { key: field.name + key, fontSize: COLUMN_FONT_SIZE, column: field, showNote: showNote })))));
}
