// Filename: convertYamlToCubeJs

const fs = require('fs');
const yaml = require('js-yaml');

// Function to generate Cube.js schema from YAML data
function generateCubeJsSchema(yamlData) {
  const contract = yamlData.contract;
  const func = yamlData.functions[0];

  // Start building the Cube.js schema as a string
  let cubeJsSchema = `// Auto-generated Cube.js schema for ${func.name}

cube(\`${func.name}\`, {
  sql: \`
    SELECT
      ${func.inputs.map(input => `${input.source} AS ${input.parameter}`).join(',\n      ')},
      ${func.calc_fields.map(field => {
        if (field.expression) {
          return `${field.expression} AS ${field.name}`;
        } else if (field.source) {
          return `${field.source} AS ${field.name}`;
        }
      }).join(',\n      ')}
    FROM
      ${contract.lakehouse_db}.contract_calls
    WHERE
      contract_calls.contract_id = '${contract.address}'
      AND contract_calls.function_name = '${func.name}'
  \`,

  measures: {
    ${func.calc_fields.map(field => `
    ${field.name}: {
      sql: \`\${CUBE}.${field.name}\`,
      type: 'sum',
    }`).join(',')}
  },

  dimensions: {
    ${func.inputs.map(input => `
    ${input.parameter.replace(/-/g, '_')}: {
      sql: \`\${CUBE}.${input.parameter}\`,
      type: '${input.type.includes('int') ? 'number' : 'string'}',
    }`).join(',')}
  },
});
`;

  return cubeJsSchema;
}

// Main script
try {
  // Load YAML file
  const yamlFile = 'dex_alex.yaml';
  const yamlContent = fs.readFileSync(yamlFile, 'utf8');
  const yamlData = yaml.load(yamlContent);

  // Generate Cube.js schema
  const cubeJsSchema = generateCubeJsSchema(yamlData);

  // Write Cube.js schema to file
  const outputFileName = `${yamlData.functions[0].name}.js`;
  fs.writeFileSync(outputFileName, cubeJsSchema);

  console.log(`Cube.js schema generated and saved to ${outputFileName}`);
} catch (e) {
  console.error(e);
}
