'use strict';
const uuid = require('uuid'); //generar uuid
const AWS = require('aws-sdk');
const R = require('ramda');
const axios = require('axios'); //invocar services

AWS.config.setPromisesDependency(require('bluebird'));
const db = new AWS.DynamoDB.DocumentClient();

module.exports.submit = (event, context, callback) => {
    console.log("Operacion crear persona...");
    const tramaInput       = JSON.parse(event.body); //trama de entrada
    //atributos de request
    const nacimiento       = tramaInput.nacimiento;  
    const colorOjos        = tramaInput.colorOjos;
    const peliculas        = tramaInput.peliculas;
    const genero           = tramaInput.genero;
    const colorCabello     = tramaInput.colorCabello;
    const altura           = tramaInput.altura;
    const hogar            = tramaInput.hogar;
    const peso             = tramaInput.peso;
    const nombre           = tramaInput.nombre;
    const colorPiel        = tramaInput.colorPiel;
    const especies         = tramaInput.especies;
    const navesEspaciales  = tramaInput.navesEspaciales;
    const url              = tramaInput.url;
    const vehiculos        = tramaInput.vehiculos;

    const miPersona = personaInfo(nacimiento,colorOjos,peliculas,genero,colorCabello,altura,hogar,peso,nombre,colorPiel,especies,navesEspaciales,url,vehiculos);
    
    crearPersona(miPersona)
    .then(res => {
      callback(null, {
        statusCode: 201,
        body: JSON.stringify({
          message: `${nombre} agregado exitosamente.`,
          personId: res.id
        })
      });
    })
    .catch(err => {
      console.log(err);
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: `${nombre} no pudo ser agregado :(`
        })
      })
    });
};
module.exports.list = (event, context, callback) => {
    console.log("Operacion listar todas las personas", event);
    var params = {
        TableName: process.env.PERSON_TABLE,
        ProjectionExpression: "id, nacimiento, colorOjos, peliculas, genero, colorCabello, altura, hogar, peso, nombre, colorPiel, especies, navesEspaciales, vehiculos"
    };
    const onScan = (err, data) => {
        if (err) {
            console.log('Error al cargar data. Error JSON:', JSON.stringify(err, null, 2));
            callback(err);
        } else {
            console.log("Listado exitoso");
            return callback(null, successResponseBuilder(JSON.stringify({
                personas: data.Items
            })
            ));
        }
    };
    db.scan(params, onScan);
};
module.exports.get = (event, context, callback) => {
    const params = {
        TableName: process.env.PERSON_TABLE,
        Key: {
            id: event.pathParameters.id,
        },
    };
    db.get(params)
        .promise()
        .then(result => {
            callback(null, successResponseBuilder(JSON.stringify(result.Item)));
        })
        .catch(error => {
            console.error(error);
            callback(new Error('No se pudo obtener persona :('));
            return;
        });
};

module.exports.getInfoPerson = (event, context, callback) => {
    
    console.log(event["params"]);
    axios.get(`https://swapi.py4e.com/api/people/${event.pathParameters.id}`)
    .then(function (response) {
        let data = response.data;
        let result = {
            "nacimiento": data.birth_year,  
            "colorOjos": data.eye_color,
            "peliculas": data.films,
            "genero": data.gender,
            "colorCabello": data.hair_color,
            "altura": data.height,
            "hogar": data.homeworld,
            "peso": data.mass,
            "nombre": data.name,
            "colorPiel": data.skin_color,
            "especies": data.species,
            "navesEspaciales": data.starships,
            "url": data.url,
            "vehiculos" : data.vehicles,
            "creado" : data.created,
            "actualziado" : data.edited
            }
            return callback(null, successResponseBuilder(JSON.stringify({
                    result
                })
            ));
    })
    .catch(function (error) {
        console.log(error);
        callback(new Error('No se pudo obtener persona'));
        return;
    })
    .then(function () {
        console.log("Finish call");
    }); 

};

const crearPersona = persona => {
    console.log('Creando persona...');
    const personaInfo = {
        TableName: process.env.PERSON_TABLE,
        Item: persona,
    };
    return db.put(personaInfo).promise()
        .then(res => persona);
};
const personaInfo = (nacimiento,colorOjos,peliculas,genero,colorCabello,altura,hogar,peso,nombre,colorPiel,especies,navesEspaciales,url,vehiculos) => {
    const ts= new Date().getTime();
    return {
        id: uuid.v1(),
        nacimiento,
        colorOjos,
        peliculas,
        genero, 
        colorCabello,
        altura,
        hogar,
        peso, 
        nombre,
        colorPiel, 
        submittedAt: ts,
        updatedAt: ts,
        especies,
        navesEspaciales,
        url,
        vehiculos
    };
};


const successResponseBuilder = (body) => {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: body
    };
};

const failureResponseBuilder = (statusCode, body) => {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: body
    };
};

