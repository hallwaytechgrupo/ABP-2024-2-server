const swaggerAutogen = require("swagger-autogen")({ openapi: "3.0.0" });

const doc = {
  info: {
    version: "1.0.0",
    title: "HallwayTech Scrum API",
    description:
      "API para cadastrar usuários, realizar login, obter questões e criar tentativas de quiz",
  },
  servers: [
    {
      url: "https://abp-2024-2-server.onrender.com",
    },
  ],
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./index.js"];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  require("./index"); // Your project's root file
});
