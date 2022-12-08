interface RefEndpoint {
  schema: string;
  table: string;
  fieldNames: string[];
  relationship: string;
}

type EnumValueResponse = {
  id: string;
  name: string;
  note: string;
};

type EnumResponse = {
  name: string;
  values: EnumValueResponse[];
};

type RefResponse = {
  id: string;
  name: string;
  from: RefEndpoint;
  to: RefEndpoint;
};

type FieldResponse = {
  name: string;
  type: string;
  pk?: boolean;
  note?: string;
  not_null?: boolean;
  unique?: string;
  fieldDefault?: {
    value: string;
    type: string;
  };
};

type TableResponse = {
  name: string;
  alias?: string;
  note?: string;
  refs?: RefResponse[];
  fields?: FieldResponse[];
};

type SchemaResponse = {
  name: string;
  note?: string;
  alias?: string;
  tables?: TableResponse[];
  enums?: EnumResponse[];
  refs?: RefResponse[];
};

interface DBMLResponse {
  schemas: SchemaResponse;
}

interface Token {
  i: number;
  x: number;
  y: number;
  text: string;
  style: Style;
}

interface Style {
  color: string;
  weight: string;
}

interface Message {
  type: "text";
  width?: number;
  height?: number;
  text: string;
  dbml: string | null;
  dbmlError: string | null;
  tokens?: Token[];
  language: string;
}
