import { v4 as uuidv4 } from "uuid";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as Constants from '../utils/constants';

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";


import AWS = require('aws-sdk')

AWS.config.update({ region: Constants.AWS_REGION })

// Initialize DynamoDB Document Client
// Create DynamoDB client
const client = new DynamoDBClient({ region: Constants.AWS_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(client);

const dynamoDB = new AWS.DynamoDB.DocumentClient()

interface RequestBody {
    email: string;
    uuid: string;
}


export async function getKeyArtifactsHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    console.log("Lease Wisely - Event Starting");

    let response: APIGatewayProxyResult = {
        statusCode: 500,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        },
        isBase64Encoded: false,
        body: JSON.stringify({ error: "Internal Server Error" })
    };

    try {

        // Extract user details from the path parameters.
        const email = event.queryStringParameters?.email

        // Extract user details from the path parameters.
        const uuid = event.queryStringParameters?.uuid

        if (!email) {
            response.statusCode = 400;
            response.body = JSON.stringify({ error: "Validation Error - email is missing" });
            return response;
        }
        console.log("Email and UUID", email, uuid);

        // Fetch data from DynamoDB
        const leaseParams = {
            TableName: Constants.LEASE_WISELY_USER_LEASES_TABLE,
            KeyConditionExpression: '#email = :email',
            ExpressionAttributeNames: {
                '#email': 'email'
            },
            ExpressionAttributeValues: {
                ':email': email
            }
        };

        const timelineParams = {
            TableName: Constants.LEASE_WISELY_TIMELINE_TABLE,
            KeyConditionExpression: '#email = :email',
            ExpressionAttributeNames: {
                '#email': 'email'
            },
            ExpressionAttributeValues: {
                ':email': email
            }
        };

        const dataFieldsToCollectParams = {
            TableName: Constants.LEASE_WISELY_DATA_FIELDS_TO_COLLECT_TABLE,
            KeyConditionExpression: '#email = :email',
            ExpressionAttributeNames: {
                '#email': 'email'
            },
            ExpressionAttributeValues: {
                ':email': email
            }
        };

        const landlordNoticeParams = {
            TableName: Constants.LEASE_WISELY_LANDLORD_NOTICES_TABLE,
            KeyConditionExpression: '#email = :email',
            ExpressionAttributeNames: {
                '#email': 'email'
            },
            ExpressionAttributeValues: {
                ':email': email
            }
        };

        const leaseSummaryParams = {
            TableName: Constants.LEASE_WISELY_LEASE_SUMMARY_TABLE,
            KeyConditionExpression: '#email = :email',
            ExpressionAttributeNames: {
                '#email': 'email'
            },
            ExpressionAttributeValues: {
                ':email': email
            }
        };

        const leaseWiselyMaintenanceAndUtilitiesParams = {
            TableName: Constants.LEASE_WISELY_MAINTENENCE_AND_UTILITIES_TABLE,
            KeyConditionExpression: '#email = :email',
            ExpressionAttributeNames: {
                '#email': 'email'
            },
            ExpressionAttributeValues: {
                ':email': email
            }
        };

        const leaseWiselyMoveinParams = {
            TableName: Constants.LEASE_WISELY_MOVE_IN_TABLE,
            KeyConditionExpression: '#email = :email',
            ExpressionAttributeNames: {
                '#email': 'email'
            },
            ExpressionAttributeValues: {
                ':email': email
            }
        };  

        const leaseWiselyRedFlagParams = {
            TableName: Constants.LEASE_WISELY_RED_FLAG_TABLE,
            KeyConditionExpression: '#email = :email',
            ExpressionAttributeNames: {
                '#email': 'email'
            },
            ExpressionAttributeValues: {
                ':email': email
            }
        };  

        const leaseWiselyRenewalAndMoveoutsParams = {
            TableName: Constants.LEASE_WISELY_RENEWAL_AND_MOVEOUTS_TABLE,
            KeyConditionExpression: '#email = :email',
            ExpressionAttributeNames: {
                '#email': 'email'
            },
            ExpressionAttributeValues: {
                ':email': email
            }
        };        
        
        const leaseWiselyRentAndFeeParams = {
            TableName: Constants.LEASE_WISELY_RENT_AND_FEE_TABLE,
            KeyConditionExpression: '#email = :email',
            ExpressionAttributeNames: {
                '#email': 'email'
            },
            ExpressionAttributeValues: {
                ':email': email
            }
        };          

        const leaseWiselyRulesAndRegulationsParams = {
            TableName: Constants.LEASE_WISELY_RULES_AND_REGULATIONS_TABLE,
            KeyConditionExpression: '#email = :email',
            ExpressionAttributeNames: {
                '#email': 'email'
            },
            ExpressionAttributeValues: {
                ':email': email
            }
        };        
        
        const leaseData = await ddbDocClient.send(new QueryCommand(leaseParams));
        const timelineData = await ddbDocClient.send(new QueryCommand(timelineParams));
        const dataFieldsToCollectData = await ddbDocClient.send(new QueryCommand(dataFieldsToCollectParams));
        const landlordNoticeData = await ddbDocClient.send(new QueryCommand(landlordNoticeParams));
        const leaseSummaryData = await ddbDocClient.send(new QueryCommand(leaseSummaryParams));
        const leaseWiselyMaintenanceAndUtilitiesData = await ddbDocClient.send(new QueryCommand(leaseWiselyMaintenanceAndUtilitiesParams));
        const leaseWiselyMoveinData = await ddbDocClient.send(new QueryCommand(leaseWiselyMoveinParams));
        const leaseWiselyRedFlagParamsData = await ddbDocClient.send(new QueryCommand(leaseWiselyRedFlagParams));
        const leaseWiselyRenewalAndMoveoutsParamsData = await ddbDocClient.send(new QueryCommand(leaseWiselyRenewalAndMoveoutsParams));
        const leaseWiselyRentAndFeeParamsData = await ddbDocClient.send(new QueryCommand(leaseWiselyRentAndFeeParams));
        const leaseWiselyRulesAndRegulationsParamsData = await ddbDocClient.send(new QueryCommand(leaseWiselyRulesAndRegulationsParams));
        
        let leaseCount = leaseData.Items?.length || 0;

        let userLeaseResponseData, timelineResponseData, dataFieldsResponseData, landlordNoticeResponseData
        let leaseSummaryResponseData, leaseWiselyMaintenanceDataResponse, leaseWiselyMoveinDataResponse
        let leaseWiselyRedFlagParamsDataResponse, leaseWiselyRenewalAndMoveoutsParamsDataResponse
        let leaseWiselyRentAndFeeParamsDataResponse, leaseWiselyRulesAndRegulationsParamsDataResponse, leaseWiselyUtilitiesParamsDataResponse

        if (leaseWiselyMaintenanceAndUtilitiesData && leaseWiselyMaintenanceAndUtilitiesData.Items && leaseWiselyMaintenanceAndUtilitiesData.Items.length > 0) {
            leaseWiselyUtilitiesParamsDataResponse = leaseWiselyMaintenanceAndUtilitiesData.Items.map(item => {
                return {
                    "maintenence-and-utilities": {
                        email: email,
                        uuid: item.uuid,
                        CableResponsibility: item.CableResponsibility || "NA",
                        ElectricityPaymentResponsibility: item.ElectricityPaymentResponsibility || "NA",
                        GasPaymentResponsibility: item.GasPaymentResponsibility || "NA",
                        HeatResponsibility: item.HeatResponsibility || "NA",
                        InternetResponsibility: item.InternetResponsibility || "NA",
                        LandscapingResponsibility: item.LandscapingResponsibility || "NA",
                        SnowRemovalResponsibility: item.SnowRemovalResponsibility || "NA",
                        ThirdPartyBillingUsed: item.ThirdPartyBillingUsed || "NA",
                        TrashandRecyclingPaymentResponsibility: item.TrashandRecyclingPaymentResponsibility || "NA",
                        WaterPaymentResponsibility: item.WaterPaymentResponsibility || "NA",
                        StateRules: item.StateRules || "NA",
                    }
                };
            });
        }

        if (leaseWiselyRulesAndRegulationsParamsData && leaseWiselyRulesAndRegulationsParamsData.Items && leaseWiselyRulesAndRegulationsParamsData.Items.length > 0) {
            leaseWiselyRulesAndRegulationsParamsDataResponse = leaseWiselyRulesAndRegulationsParamsData.Items.map(item => {
                return {
                    "rules-and-regulations": {
                        email: email,
                        uuid: item.uuid,
                        PetsAllowed: item.PetsAllowed || "NA",
                        ProhibitedActivities: item.ProhibitedActivities || "NA",
                        SmokingAllowed: item.SmokingAllowed || "NA"
                    }
                };
            });
        }

        if (leaseWiselyRenewalAndMoveoutsParamsData && leaseWiselyRenewalAndMoveoutsParamsData.Items && leaseWiselyRenewalAndMoveoutsParamsData.Items.length > 0) {
            leaseWiselyRenewalAndMoveoutsParamsDataResponse = leaseWiselyRenewalAndMoveoutsParamsData.Items.map(item => {
                return {
                    "renewal-and-moveout": {
                        email: email,
                        uuid: item.uuid,
                        Actionsifnotrenewingandmovingout: item.Actionsifnotrenewingandmovingout || "NA",
                        Consequencesofmissingnoticetovacatedeadline: item.Consequencesofmissingnoticetovacatedeadline || "NA",
                        Earlyleasetermination: item.Earlyleasetermination || "NA",
                        LeaseEndDate: item.LeaseEndDate || "NA",
                        NoticetoVacateDate: item.NoticetoVacateDate || "NA",
                        StateRulesforMonthtoMonthLandlordTerminationNotice: item.StateRulesforMonthtoMonthLandlordTerminationNotice || "NA",
                        StateRulesforNoticePeriodonRaisingRent: item.StateRulesforNoticePeriodonRaisingRent || "NA",
                        Sublettingpermission: item.Sublettingpermission || "NA"
                    }
                };
            });
        }

        if (leaseWiselyRentAndFeeParamsData && leaseWiselyRentAndFeeParamsData.Items && leaseWiselyRentAndFeeParamsData.Items.length > 0) {
            leaseWiselyRentAndFeeParamsDataResponse = leaseWiselyRentAndFeeParamsData.Items.map(item => {
                return {
                    "rent-and-fee": {
                        email: email,
                        uuid: item.uuid,
                        LateFeeif10DaysLate: item.LateFeeif10DaysLate || "NA",
                        LateFeeif1DayLate: item.LateFeeif1DayLate || "NA",
                        LateFeeif3DaysLate: item.LateFeeif3DaysLate || "NA",
                        LateFeeif5DaysLate: item.LateFeeif5DaysLate || "NA",
                        LateFeePolicy: item.LateFeePolicy || "NA",
                        LostKeyFee: item.LostKeyFee || "NA",
                        NonSufficientFunds_ReturnedCheckFee: item.NonSufficientFunds_ReturnedCheckFee || "NA",
                        OtherFees: item.OtherFees || "NA",
                        PetDepositAmount: item.PetDepositAmount || "NA",
                        PetRentAmount: item.PetRentAmount || "NA",
                        RentAmount: item.RentAmount || "NA",
                        RentDueDate: item.RentDueDate || "NA",
                        StateRulesforFilingEviction: item.StateRulesforFilingEviction || "NA",
                        StateRulesforMandatoryGracePeriod: item.StateRulesforMandatoryGracePeriod || "NA",
                        StateRulesforMaximumLateFee: item.StateRulesforMaximumLateFee || "NA"
                    }
                };
            });
        }

        if (leaseWiselyRedFlagParamsData && leaseWiselyRedFlagParamsData.Items && leaseWiselyRedFlagParamsData.Items.length > 0) {
            leaseWiselyRedFlagParamsDataResponse = leaseWiselyRedFlagParamsData.Items.map(item => {
                return {
                    "red-flags": {
                        email: email,
                        uuid: item.uuid,
                        CounterSignature: item.CounterSignature || "NA",
                        FullAddress: item.FullAddress || "NA",
                        LeaseStartDate: item.LeaseStartDate || "NA",
                        NoticetoEnterRules: item.NoticetoEnterRules || "NA",
                        NoticetoVacateDate: item.NoticetoVacateDate || "NA",
                        PetPolicy: item.PetPolicy || "NA",
                        PropertyManager_LandlordName: item.PropertyManager_LandlordName || "NA",
                        RentAmount: item.RentAmount || "NA",
                        RentDueDate: item.RentDueDate || "NA",
                        RentPaymentInstructions: item.RentPaymentInstructions || "NA",
                        ResidentNames: item.ResidentNames || "NA",
                        SecurityDepositAmount: item.SecurityDepositAmount || "NA",
                        UtilitiesResponsibilities: item.UtilitiesResponsibilities || "NA"
                    }
                };
            });
        }
        if (leaseWiselyMoveinData && leaseWiselyMoveinData.Items && leaseWiselyMoveinData.Items.length > 0) {
            leaseWiselyMoveinDataResponse = leaseWiselyMoveinData.Items.map(item => {
                return {
                    "movein-date": {
                        email: email,
                        uuid: item.uuid,
                        accesstoamenitiesorfacilities: item.Accesstoamenitiesorfacilities || "NA",
                        deadlinetocompletemoveininspection: item.Deadlinetocompletemoveininspection || "NA",
                        isrentersinsurancerequired: item.Isrentersinsurancerequired || "NA",
                        leaseincludesparking: item.Leaseincludesparking || "NA",
                        mailboxkeysinformation: item.Mailboxkeysinformation || "NA",
                        penaltiespremoveinorwithin30days: item.Penaltiespremoveinorwithin30days || "NA",
                        timetoreportpestissuesuponmovein: item.Timetoreportpestissuesuponmovein || "NA",
                        "utilities setup before movein": item.Utilitiessetupbeforemovein || "NA",
                    }
                };
            });
        }

        if (leaseSummaryData && leaseSummaryData.Items && leaseSummaryData.Items.length > 0) {
            leaseSummaryResponseData = leaseSummaryData.Items.map(item => {
                return {
                    "summary": {
                        email: email,
                        uuid: item.uuid,
                        emergencyMaintenancePhoneNumber: item.EmergencyMaintenancePhoneNumber || "NA",
                        petIncludedonLease: item.PetIncludedonLease || "NA",
                        propertyManager_LandlordName: item.PropertyManager_LandlordName || "NA",
                        propertyManager_LandlordPhoneEmail: item.PropertyManager_LandlordPhoneEmail || "NA",
                        propertyManager_LandlordPhoneNumber: item.PropertyManager_LandlordPhoneNumber || "NA",
                        rentAmount: item.RentAmount || "NA",
                        rentDueDate: item.RentDueDate || "NA",
                        residentNames: item.ResidentNames || "NA"
                    }
                };
            });
        }

        if (landlordNoticeData && landlordNoticeData.Items && landlordNoticeData.Items.length > 0) {
            landlordNoticeResponseData = landlordNoticeData.Items.map(item => {
                return {
                    "Landlord-Notice": {
                        email: email,
                        uuid: item.uuid,
                        noticetoEnterRules: item.NoticetoEnterRules || "NA",
                        stateRules: item.StateRules || "NA"
                    }
                };
            });
        }
        if (dataFieldsToCollectData && dataFieldsToCollectData.Items && dataFieldsToCollectData.Items.length > 0) {
            dataFieldsResponseData = dataFieldsToCollectData.Items.map(item => {
                return {
                    "DataFields": {
                        email: email,
                        uuid: item.uuid,
                        cityofProperty: item.CityofProperty || "NA",
                        numberofBathrooms: item.NumberofBathrooms || "NA",
                        numberofBedrooms: item.NumberofBedrooms || "NA",
                        stateofProperty: item.StateofProperty || "NA",
                        streetAddressofProperty: item.StreetAddressofProperty || "NA",
                        zipCodeofProperty: item.ZipCodeofProperty || "NA"
                    }
                };
            });
        }

        if (leaseData && leaseData.Items && leaseData.Items.length > 0) {
            userLeaseResponseData = leaseData.Items.map(item => {
                return {
                    "User-Lease-Info": {
                        email: email,
                        uuid: item.uuid,
                        leaseDataAvailable: item.leaseDataAvailable || "NA"
                    }
                };
            });
        }

        if (timelineData && timelineData.Items && timelineData.Items.length > 0) {
            timelineResponseData = timelineData.Items.map(item => {
                return {
                    "Timeline": {
                        email: email,
                        uuid: item.uuid,
                        leaseSignedDate: item.leaseSignedDate || "NA",
                        leaseEndDate: item.LeaseEndDate || "NA",
                        leaseStartDate: item.LeaseStartDate || "NA",
                        moveinInspectionDeadlineDate: item.MoveinInspectionDeadlineDate || "NA",
                        noticetoVacateDate: item.NoticetoVacateDate || "NA",
                        securityDepositReturnDate: item.SecurityDepositReturnDate || "NA"
                    }
                };
            });
        }
            
        response.statusCode = 200;
        response.body = JSON.stringify({
            "lease-count": leaseCount,
            "user-lease-master": {
                "leases-info": userLeaseResponseData,
                "leases-timeline": timelineResponseData,
                "leases-datafields": dataFieldsResponseData,
                "leases-landlordnotices": landlordNoticeResponseData,
                "leases-summary": leaseSummaryResponseData,
                "leases-maintenance": leaseWiselyMaintenanceDataResponse,
                "leases-movein-data": leaseWiselyMoveinDataResponse,
                "leases-red-flags": leaseWiselyRedFlagParamsDataResponse,
                "leases-reneweal-and-moveout": leaseWiselyRenewalAndMoveoutsParamsDataResponse,
                "leases-rent-and-fee": leaseWiselyRentAndFeeParamsDataResponse,
                "leases-rules-and-regulations": leaseWiselyRulesAndRegulationsParamsDataResponse,
                "leases-utilities": leaseWiselyUtilitiesParamsDataResponse
            }
        });
        return response;
    } catch (error: unknown) {
        console.log("Error processing request:", error);
        response.statusCode = 500;
        response.body = JSON.stringify({
            error: "Internal Server Error",
            details: parseError(error)
        })
        return response;
    }

    console.log("Response from Lambda", JSON.stringify(response));
    return response;
}


// Helper function to parse unknown error
function parseError(error: unknown): string {
        if (error instanceof Error) {
            // If error is an instance of Error, return its message and stack trace
            return `${error.message}\n${error.stack}`;
        } else if (typeof error === 'string') {
            // If error is a string, return it directly
            return error;
        } else {
            // Fallback for any other type of error
            return JSON.stringify(error);
        }
    }
