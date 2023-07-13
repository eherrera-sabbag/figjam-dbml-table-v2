const {
  widget: { Text, AutoLayout },
} = figma;

export default function Column(props: {
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
