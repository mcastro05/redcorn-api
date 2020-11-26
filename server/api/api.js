'use strict';
// Load modules

const Promise = require('bluebird');
const axios = require('axios');


exports.plugin = {
    name: 'api',
    register: async function (server) {

        const getValuation = (prices, postcode) =>{
            let pricePerPostcode = 0;
            prices.forEach((price) => {
                price.field_168_raw.forEach((pc) => {
                  if (postcode.startsWith(pc.identifier)) {
                    pricePerPostcode = price.field_170_raw;
                  }
                });
            });

            return pricePerPostcode;
        }

        const getVehicleData = async (vrn) => {
            const ak = process.env.UK_VEHICLE_API_KEY;
            try {
                const result = await axios.get(`https://uk1.ukvehicledata.co.uk/api/datapackage/VehicleData?v=2&api_nullitems=1&auth_apikey=${ak}&key_VRM=${vrn}`);
                console.log(result);
                if (result.Response.StatusCode != 'Success') {

                    return {status: 'Error', message: result.Response.StatusMessage};
                }

                let response = {};

                response.status = 'Sucesss';
                response.weight = result.Response.DataItems.TechnicalDetails.Dimensions.KerbWeight;
                response.make = result.Response.DataItems.ClassificationDetails.Dvla.Make;
                response.model = result.Response.DataItems.ClassificationDetails.Dvla.Model;
                response.year = result.Response.DataItems.VehicleRegistration.YearOfManufacture;
                response.colour = result.Response.DataItems.VehicleRegistration.Colour;
                response.vin = result.Response.DataItems.VehicleRegistration.Vin;

                return response;

            }catch(error) {
                console.error(error);
                return {status: 'Error', message: "Unable to get vehicle data"};
            }
            
            
        }

        server.route([
            {
                method: 'GET',
                path: '/status',
                handler: async function (request, h) {
                    return {status: 'ok'};
                }
            },
            {
                method: 'POST',
                path: '/getvaluation',
                handler: async function (request, h) {
                    const payload = request.payload;
                    const vehicleData = await getVehicleData(payload.vrn);
                    if(vehicleData.status == 'Error')
                        return { "error": `${vehicleData.message}` }
                    
                    const pricePerPostcode = getValuation(payload.prices, payload.postcode);
                    if (pricePerPostcode == 0) {
                        return { "error": 'The postcode you entered is not valid to quote ' }
                    }

                    let response = Object.assign({},
                       vehicleData,
                       {valuation: pricePerPostcode}
                    )
                    return response;
                }
            }
        ]);
    }
};
