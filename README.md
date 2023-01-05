# TaxOneWebServiceConsumer

# Pré-requisitos
- Instalar NodeJS

# Etapas para funcionamento
> git clone repo

> npm install

# Tutorial
Para primeira etapa do processo, precisamos identificar o arquivo ***config.json*** e configurá-lo.

Este arquivo possui três objetos principais: 
- ***TaxOneCredentials*** será utilizado para passarmos nossos parâmetros para geração do **TOKEN/LOTE** e dados das importações, como: Empresa, Estabelecimento, Data Inicial e Data Final.
- ***ReuseCredentials*** aqui podemos preencher com o **TOKEN/LOTE** caso queiramos reutilizar um **TOKEN/LOTE** que já criamos ou ainda não importamos. Se não for o caso podemos deixar estas informações vazias que o processo irá gerar pra gente.
- ***APIurls*** aqui configuramos o caminho das APIs que iremos utilizar, podemos configurar para outros ambientes caso o queira.

Precisamos separar os arquivos de SAFX e colocarmos em uma pasta que chamei de ***Files*** (necessário criar), o programa irá percorrer todos os arquivos dentro desta pasta para importar para o TaxOne. 

Se possuirmos mais de um arquivo eles serão encaixados dentro de um mesmo lote.

> Importante: O arquivo deve ter o nome exato da safx que iramos importar, exemplo, se vamos importar uma safx53, o nome do arquivo precisará estar como ***safx53.txt***.

Após configurarmos o json ***config*** e ter os arquivos dentro da pasta ***Files***, podemos executar.

A Execução pode ser feita a partir de um arquivo ***executor.bat*** ou pelo comando ****node index****.
Os logs serão apresentados via console.
