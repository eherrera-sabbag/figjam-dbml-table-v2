const convertToJson = (dbml) => {
    // let dbmlResponse = []
    // loop through schemas and tables and create new json name, notes, columns, and relationships
    const dbmlResponse = dbml.schemas.map((schema) => {
        const { name: schemaName, note: schemaNote } = schema;
        const newSchema = {
            name: schemaName,
            note: schemaNote,
            tables: schema.tables.map((table) => {
                const newTable = {
                    name: table.name,
                    alias: table.alias,
                    note: table.note,
                    fields: table.fields.map((field) => {
                        const newField = {
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
                const newEnum = {
                    name: enumItem.name,
                    values: enumItem.values.map((value) => {
                        const newValue = {
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
                const fromEnd = ref.endpoints[0];
                const toEnd = ref.endpoints[1];
                const fromEndString = [
                    fromEnd.schemaName,
                    fromEnd.tableName,
                    fromEnd.fieldNames,
                    fromEnd.relation,
                ].join("|");
                const toEndString = [
                    toEnd.schemaName,
                    toEnd.tableName,
                    toEnd.fieldNames,
                    toEnd.relation,
                ].join("|");
                const newRef = {
                    id: ref.id,
                    name: ref.name,
                    from: {
                        schema: fromEnd.schemaName || 'public',
                        table: fromEnd.tableName,
                        relation: fromEnd.relation,
                        fieldNames: fromEnd.fieldNames,
                    },
                    to: {
                        schema: toEnd.schemaName || 'public',
                        table: toEnd.tableName,
                        relation: toEnd.relation,
                        fieldNames: toEnd.fieldNames,
                    },
                    refDef: [fromEndString, toEndString].join("~"),
                };
                return newRef;
            }),
        };
        return newSchema;
    });
    return JSON.stringify(dbmlResponse);
};
export default { convertToJson };
