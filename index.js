const { executeJob, exportToFile } = require("./reader");
const config = require("./config.json");
const axios = require("axios");
const path = require("path");

async function generateCredentials() {
  const url = config.APIurls.Auth;
  const login = config.TaxOneCredentials.login;
  const password = config.TaxOneCredentials.password;
  let token = "";

  const configApi = {
    method: "post",
    url: url,
    headers: {
      "Content-Type": "application/json",
      login: login,
      password: password,
    },
    data: "",
  };

  await axios(configApi)
    .then(function (response) {
      token = response.data;
    })
    .catch(function (error) {
      console.log(`Error - Auth: ${error}`);
    });

  return token;
}

async function generateLote(token) {
  const url = config.APIurls.Lote;
  let lote = "";

  const configApi = {
    method: "post",
    url: url,
    headers: {
      token: token,
    },
    data: "",
  };

  await axios(configApi)
    .then(function (response) {
      lote = response.data;
    })
    .catch(function (error) {
      console.log(`Error - Lote: ${error}`);
    });

  return lote.num_lote;
}

async function sendCargaRequest(token, lote, data) {
  const url = config.APIurls.Carga;
  const empresa = config.TaxOneCredentials.empresa;
  const estabelecimento = config.TaxOneCredentials.estabelecimento;
  const dataIni = config.TaxOneCredentials.dataIni;
  const dataFim = config.TaxOneCredentials.dataFim;

  const configApi = {
    method: "post",
    url: url,
    headers: {
      token: token,
      numLote: lote,
      codEmpresa: empresa,
      codEstab: estabelecimento,
      dataIni: dataIni,
      dataFim: dataFim,
      "Content-Type": "application/json",
    },
    data: data,
  };

  //console.log(configApi);

  await axios(configApi)
    .then(function (response) {
      console.log("sendingCargaRequest...");
    })
    .catch(function (error) {
      console.log(`Error - Carga: ${error}`);
    });
}

async function getCargaResponse(token, lote) {
  const url = config.APIurls.ConsultaCarga;
  let responseMessage = [];

  const configApi = {
    method: "post",
    url: url,
    headers: {
      token: token,
      numLote: lote,
    },
    data: "",
  };

  await axios(configApi)
    .then(function (response) {
      responseMessage = response.data.protocolos;
    })
    .catch(function (error) {
      console.log(`Error - Carga Response: ${error}`);
    });

  return responseMessage;
}

async function sendImportacaoRequest(token, lote) {
  const url = config.APIurls.Importacao;
  let responseMessage;

  const configApi = {
    method: "post",
    url: url,
    headers: {
      token: token,
      numLote: lote,
    },
    data: "",
  };

  await axios(configApi)
    .then((response) => {
      responseMessage = response.data;
      console.log(response.data);
    })
    .catch(function (error) {
      console.log(`Error - Importacao Request: ${error}`);
    });

  return responseMessage;
}

async function getImportacaoResponse(token, lote) {
  const url = config.APIurls.ConsultaImportacao;
  let responseMessage = [];

  const configApi = {
    method: "post",
    url: url,
    headers: {
      token: token,
      numLote: lote,
    },
    data: "",
  };

  await axios(configApi)
    .then(function (response) {
      responseMessage = response.data.importacoes;
    })
    .catch(function (error) {
      console.log(`Error - Consulta Imp: ${error}`);
    });

  return responseMessage;
}

async function executorSendCargaRequest(token, lote, jobs) {
  //Chamada para os arquivos de safx
  await Promise.all(
    jobs.map((job) => sendCargaRequest(token, lote, JSON.stringify(job)))
  );
  let responseCarga = await getCargaResponse(token, lote);
  let cargaProcessRunning = responseCarga.filter((response) =>
    response.mensagem.includes("processamento")
  );
  let cargaTentative = 0;

  //Verificando se ainda existem processos com o status "Carga em fila de processamento"
  while (
    cargaProcessRunning.length > 0 &&
    cargaTentative <= config.ApiConfigs.cargaTentatives
  ) {
    responseCarga = await getCargaResponse(token, lote);
    cargaProcessRunning = responseCarga.filter((response) =>
      response.mensagem.includes("processamento")
    );
    await new Promise((resolve) =>
      setTimeout(resolve, config.ApiConfigs.cargaInterval)
    );
    cargaTentative++;
  }

  let processSucess = responseCarga.filter((response) =>
    response.mensagem.includes("Carga finalizada")
  );
  console.log(processSucess);
  return processSucess;
}

async function executorSendImportacaoRequest(token, lote, process) {
  //Verificando se as cargas foram finalizadas com sucesso e realizando as importações
  if (process) {
    await sendImportacaoRequest(token, lote);
    let responseImp = await getImportacaoResponse(token, lote);
    let ImpTentative = 0;

    while (
      responseImp === undefined &&
      ImpTentative <= config.ApiConfigs.importTentatives
    ) {
      responseImp = await getImportacaoResponse(token, lote);
      await new Promise((resolve) =>
        setTimeout(resolve, config.ApiConfigs.importInterval)
      );
      ImpTentative++;
    }

    const processSucess = responseImp.filter((response) =>
      response.mensagem.includes("Importação finalizada")
    );
    console.log(processSucess);
    await exportToFile(
      path.join(__dirname, "output", "log.txt"),
      JSON.stringify(processSucess)
    );
    console.log("====================");
    console.log(processSucess[0].erros);
  }
}

async function Execute() {
  //Show Configurations
  console.log("===================================================");
  console.log(`Parâmetros para execução:`);
  console.log(
    `Consultas de carga ${config.ApiConfigs.cargaTentatives}x a cada ${config.ApiConfigs.cargaInterval}ms`
  );
  console.log(
    `Consultas de importação ${config.ApiConfigs.importTentatives}x a cada ${config.ApiConfigs.importInterval}ms`
  );

  console.log("===================================================");

  //Parte relacionada a Leitura das SAFX e transformando em JSON
  const jobs = await executeJob(path.join(__dirname, "Files"));

  //Chamada para geração do Token
  const token = config.ReuseCredentials.token
    ? config.ReuseCredentials.token
    : await generateCredentials();
  console.log(token);

  //Chamada para geração do Lote
  const lote = config.ReuseCredentials.lote
    ? config.ReuseCredentials.lote
    : await generateLote(token);
  console.log(lote);

  //Chamada para carga
  const process = await executorSendCargaRequest(token, lote, jobs);

  //Chamada para importação
  await executorSendImportacaoRequest(token, lote, process);
}

Execute();
