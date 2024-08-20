import { v4 as uuidv4 } from "uuid";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as Constants from '../utils/constants';

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
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

/**
 * Fetches and prints all values for a given state from the StateRule table.
 * @param stateName The name of the state to query.
 */
async function fetchStateRules(stateName: string, lookupValue: string): Promise<string> {
    const params = {
        TableName: Constants.LEASE_WISELY_STATE_RUILES_TABLE,
        KeyConditionExpression: "#state = :state",
        ExpressionAttributeNames: {
            "#state": "state"
        },
        ExpressionAttributeValues: {
            ":state": stateName
        }
    };

    try {
        const data = await ddbDocClient.send(new QueryCommand(params));
        if (data.Items && data.Items.length > 0) {
            console.log("Data retrieved for state", stateName, ":", data.Items);
            const stateRuleValue = data.Items[0][lookupValue];
            console.log(`${lookupValue} for ${stateName}:`, stateRuleValue);
            return stateRuleValue;
        } else {
            console.log("No data found for state", stateName);
            return "NA"
        }
    } catch (error) {
        console.error("Error fetching state rules for", stateName, ":", error);
        return "NA"
    }
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


    async function updateLeaseStartDate(email: string, uuid: string, newLeaseStartDate: string): Promise<void> {
        const updateParams = {
            TableName: Constants.LEASE_WISELY_USER_LEASES_TABLE,
            Key: {
                email: email,
                uuid: uuid
            },
            UpdateExpression: "set leaseStartDate = :pa",
            ExpressionAttributeValues: {
                ":pa": newLeaseStartDate
            },
            ReturnValues: "UPDATED_NEW" as const  // Ensures type safety
        };
    
        try {
            const result = await ddbDocClient.send(new UpdateCommand(updateParams));
            console.log("Successfully updated property address:", result);
        } catch (error) {
            console.error("Failed to update property address:", error);
            throw error;  // Re-throw the error for further handling if necessary
        }
    }

    async function updatePropertyAddress(email: string, uuid: string, newPropertyAddress: string): Promise<void> {
        const updateParams = {
            TableName: Constants.LEASE_WISELY_USER_LEASES_TABLE,
            Key: {
                email: email,
                uuid: uuid
            },
            UpdateExpression: "set leasePropertyAddress = :pa",
            ExpressionAttributeValues: {
                ":pa": newPropertyAddress
            },
            ReturnValues: "UPDATED_NEW" as const  // Ensures type safety
        };
    
        try {
            const result = await ddbDocClient.send(new UpdateCommand(updateParams));
            console.log("Successfully updated property address:", result);
        } catch (error) {
            console.error("Failed to update property address:", error);
            throw error;  // Re-throw the error for further handling if necessary
        }
    }
    
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
            let promises = leaseWiselyMaintenanceAndUtilitiesData.Items.map(async item => {
                const propertyState = item.StateofProperty || "NA";
                let maintenanceStateRules = "NA";

                if (propertyState && propertyState !== "NA") {
                    console.log("Running for state - ", propertyState);
                    try {
                        maintenanceStateRules = await fetchStateRules(propertyState, "Maintenance");
                    } catch (error) {
                        console.error("Error fetching Maintenance rules:", error);
                        maintenanceStateRules = "Failed to fetch";
                    }
                }
                return {
                    "maintenence-and-utilities": {
                        email: email,
                        uuid: item.uuid,
                        "Cable Responsibility": item.CableResponsibility || "NA",
                        "Electricity Responsibility": item.ElectricityPaymentResponsibility || "NA",
                        "Gas Responsibility": item.GasPaymentResponsibility || "NA",
                        "Heat Responsibility": item.HeatResponsibility || "NA",
                        "Internet Responsibility": item.InternetResponsibility || "NA",
                        "Landscaping Responsibility": item.LandscapingResponsibility || "NA",
                        "Snow Removal Responsibility": item.SnowRemovalResponsibility || "NA",
                        "Trash and Recycling Responsibility": item.TrashandRecyclingPaymentResponsibility || "NA",
                        "Water Responsibility": item.WaterPaymentResponsibility || "NA",
                        "Does landlord use a third-party billing company for utilities?": item.ThirdPartyBillingUsed || "NA",
                        "Below are the state laws that pertain to your lease": "",
                        "State Rules for Withholding Rent for Maintenance": maintenanceStateRules || "NA"
                    }
                };
            });

            // Use Promise.all to wait for all promises to resolve
            leaseWiselyUtilitiesParamsDataResponse = await Promise.all(promises);
        }
        

        if (leaseWiselyRulesAndRegulationsParamsData && leaseWiselyRulesAndRegulationsParamsData.Items && leaseWiselyRulesAndRegulationsParamsData.Items.length > 0) {
            leaseWiselyRulesAndRegulationsParamsDataResponse = leaseWiselyRulesAndRegulationsParamsData.Items.map(item => {
                return {
                    "rules-and-regulations": {
                        email: email,
                        uuid: item.uuid,
                        "Pets Allowed": item.PetsAllowed || "NA",
                        "Smoking Allowed": item.SmokingAllowed || "NA",
                        "Prohibited Activities": item.ProhibitedActivities || "NA"
                    }
                };
            });
        }

        if (leaseWiselyRenewalAndMoveoutsParamsData && leaseWiselyRenewalAndMoveoutsParamsData.Items && leaseWiselyRenewalAndMoveoutsParamsData.Items.length > 0) {
            let promises = leaseWiselyRenewalAndMoveoutsParamsData.Items.map(async item => {
                const propertyState = item.StateofProperty || "NA"
                let stateRulesforMonthtoMonthLandlordTerminationNotice = "NA"
                let stateRulesforNoticePeriodonRaisingRent = "NA"

                if (propertyState && propertyState !== "NA") {
                    console.log("Running for state - ", propertyState);
                    try {
                        stateRulesforMonthtoMonthLandlordTerminationNotice = await fetchStateRules(propertyState, "Month-to-MonthTerminationNotice");
                        stateRulesforNoticePeriodonRaisingRent = await fetchStateRules(propertyState, "RaisingRent");
                    } catch (error) {
                        console.error("Error fetching Maintenance rules:", error);
                        stateRulesforMonthtoMonthLandlordTerminationNotice = "NA";
                        stateRulesforNoticePeriodonRaisingRent = "NA"
                    }
                }
                return {
                    "renewal-and-moveout": {
                        email: email,
                        uuid: item.uuid,
                        "Lease End Date": item.LeaseEndDate || "NA",
                        "Notice to Vacate Date": item.NoticetoVacateDate || "NA",
                        "What do I need to do if I plan to move out at lease end?": item.Actionsifnotrenewingandmovingout || "NA",
                        "What happens if I miss my notice to vacate deadline?": item.Consequencesofmissingnoticetovacatedeadline || "NA",
                        "Early Termination Policy": item.Earlyleasetermination || "NA",
                        "Subleasing Policy": item.Sublettingpermission || "NA",
                        "Below are the state laws that pertain to your lease": "",
                        "State Rules for Month to Month Landlord Termination Notice": stateRulesforMonthtoMonthLandlordTerminationNotice || "NA",
                        "State Rules for Notice Period on Raising Rent": stateRulesforNoticePeriodonRaisingRent || "NA",

                    }
                };              
            });

            // Use Promise.all to wait for all promises to resolve
            leaseWiselyRenewalAndMoveoutsParamsDataResponse = await Promise.all(promises);
        }

        if (leaseWiselyRentAndFeeParamsData && leaseWiselyRentAndFeeParamsData.Items && leaseWiselyRentAndFeeParamsData.Items.length > 0) {
            let promises = leaseWiselyRentAndFeeParamsData.Items.map(async item => {
                const propertyState = item.StateofProperty || "NA"
                let stateRulesforFilingEviction = "NA"
                let stateRulesforMandatoryGracePeriod = "NA"
                let stateRulesforMaximumLateFee = "NA"
                if (propertyState && propertyState != "NA") {
                    console.log("Running for state - ", propertyState);
                    try {
                        stateRulesforFilingEviction = await fetchStateRules(propertyState, "EvictionTimeframe");
                        stateRulesforMandatoryGracePeriod = await fetchStateRules(propertyState, "MandatoryGracePeriod");
                        stateRulesforMaximumLateFee = await fetchStateRules(propertyState, "MaximumLateFee");
                    } catch (error) {
                        console.error("Error fetching Maintenance rules:", error);
                        stateRulesforFilingEviction = "NA";
                        stateRulesforMandatoryGracePeriod = "NA"
                        stateRulesforMaximumLateFee = "NA"
                    }
                }
                return {
                    "rent-and-fee": {
                        email: email,
                        uuid: item.uuid,
                        "Rent Amount": item.RentAmount || "NA",
                        "Rent Due Date": item.RentDueDate || "NA",
                        "Late Fee Policy": item.LateFeePolicy || "NA",
                        "Pet Deposit Amount": item.PetDepositAmount || "NA",
                        "Pet Rent Amount": item.PetRentAmount || "NA",
                        "Lost Key Fee": item.LostKeyFee || "NA",                        
                        "Non-Sufficient Funds / Returned Check Fee": item.NonSufficientFunds_ReturnedCheckFee || "NA",
                        "Other Fees": item.OtherFees || "NA",
                        "Below are the state laws that pertain to your lease": "",
                        "State Rules for Filing Eviction": stateRulesforFilingEviction || "NA",
                        "State Rules for Mandatory Grace Period for Rent Payment": stateRulesforMandatoryGracePeriod || "NA",
                        "State Rules for Maximum Late Fee Landlord Can Charge": stateRulesforMaximumLateFee || "NA"
                    }
                };
            });

            // Use Promise.all to wait for all promises to resolve
            leaseWiselyRentAndFeeParamsDataResponse = await Promise.all(promises);
        }

        if (leaseWiselyRedFlagParamsData && leaseWiselyRedFlagParamsData.Items && leaseWiselyRedFlagParamsData.Items.length > 0) {
            leaseWiselyRedFlagParamsDataResponse = leaseWiselyRedFlagParamsData.Items.map(item => {
                return {
                    "red-flags": {
                        email: email,
                        uuid: item.uuid,
                        "Counter Signature": item.CounterSignature || "NA",
                        "Full Address": item.FullAddress || "NA",
                        "Lease Start Date": item.LeaseStartDate || "NA",
                        "Notice to Enter Rules": item.NoticetoEnterRules || "NA",
                        "Notice to Vacate Date": item.NoticetoVacateDate || "NA",
                        "Pet Policy": item.PetPolicy || "NA",
                        "Property Manager/ Landlord Name": item.PropertyManager_LandlordName || "NA",
                        "Rent Amount": item.RentAmount || "NA",
                        "Rent Due Date": item.RentDueDate || "NA",
                        "Rent Payment Instructions": item.RentPaymentInstructions || "NA",
                        "Resident Names": item.ResidentNames || "NA",
                        "Security Deposit Amount": item.SecurityDepositAmount || "NA",
                        "Utilities Responsibilities": item.UtilitiesResponsibilities || "NA"
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
                        "Amenities / Facilities you have access to": item.Accesstoamenitiesorfacilities || "NA",
                        "Deadline to complete move-in inspection": item.Deadlinetocompletemoveininspection || "NA",
                        "Is renters insurance Required?": item.Isrentersinsurancerequired || "NA",
                        "Does my lease include parking?": item.Leaseincludesparking || "NA",
                        "Mailbox Keys Information": item.Mailboxkeysinformation || "NA",
                        "When is my deadline to report pest issues before it becomes my responsibility?": item.Timetoreportpestissuesuponmovein || "NA",
                        "Do I need to set up utilities prior to moving in?": item.Utilitiessetupbeforemovein || "NA",
                        "What can I be penalized for if not completed prior to moving in or within 30 days of moving in?": item.Penaltiespremoveinorwithin30days || "NA"
                    }
                };
            });
        }

        if (leaseSummaryData && leaseSummaryData.Items && leaseSummaryData.Items.length > 0) {
            leaseSummaryResponseData = leaseSummaryData.Items.map(item => {
                let currentEmail = email
                let curentUUID = item.uuid
                let currentLeasePropertyAddress = item.LeasePropertyAddress || "NA"

                try {
                    updatePropertyAddress(currentEmail, curentUUID, currentLeasePropertyAddress);
                } catch (error) {
                    return
                }
            
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
                        residentNames: item.ResidentNames || "NA",
                        leasePropertyAddress: item.LeasePropertyAddress || "NA"
                    }
                };
            });
        }

        if (landlordNoticeData && landlordNoticeData.Items && landlordNoticeData.Items.length > 0) {
            let promises = landlordNoticeData.Items.map(async item => {
                const propertyState = item.StateofProperty || "NA"
                let stateRuleNoticeToEnter = "NA"
                if (propertyState && propertyState !== "NA") {
                    console.log("Running for state - ", propertyState);
                    try {
                        stateRuleNoticeToEnter = await fetchStateRules(propertyState, "NoticetoEnter");
                    } catch (error) {
                        console.error("Error fetching Maintenance rules:", error);
                        stateRuleNoticeToEnter = "NA";
                    }
                }
                return {
                    "Landlord-Notice": {
                        email: email,
                        uuid: item.uuid,
                        "Notice to Enter Rules": item.NoticetoEnterRules || "NA",                        
                        "Below are the state laws that pertain to your lease": "",
                        "State Rules": stateRuleNoticeToEnter || "NA"
                    }
                };
            });                

            // Use Promise.all to wait for all promises to resolve
            landlordNoticeResponseData = await Promise.all(promises);
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
            // Extract the first part of the address before the comma
            const shortAddress = item.leasePropertyAddress ? item.leasePropertyAddress.split(',')[0] : "NA";

            // Convert leaseStartDate to the desired format
            let formattedDate = "NA";
            if (item.leaseStartDate) {
                const dateObj = new Date(item.leaseStartDate);
                const month = dateObj.getMonth() + 1; // getMonth() returns 0-11, so we add 1
                const day = dateObj.getDate();
                const year = dateObj.getFullYear();
                formattedDate = `- ${month}/${day}/${year}`;
            }

                return {
                    "User-Lease-Info": {
                        email: email,
                        uuid: item.uuid,
                        leaseDataAvailable: item.leaseDataAvailable || "NA",
                        leasePropertyAddress: shortAddress,
                        leaseStartDate: formattedDate
                    }
                };
            });
        }

        if (timelineData && timelineData.Items && timelineData.Items.length > 0) {
            const currentDate = new Date(); // Get the current date
            const firstOfNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1); // Set to the 1st of next month
        
            timelineResponseData = timelineData.Items.map(item => {
                let currentEmail = email
                let curentUUID = item.uuid
                let currentLeaseStartDate = item.LeaseStartDate || "NA"

                try {
                    updateLeaseStartDate(currentEmail, curentUUID, currentLeaseStartDate);
                } catch (error) {
                    return
                }

                return {
                    "Timeline": {
                        email: email,
                        uuid: item.uuid,
                        leaseSignedDate: item.leaseSignedDate || "NA",
                        leaseEndDate: item.LeaseEndDate || "NA",
                        leaseStartDate: item.LeaseStartDate || "NA",
                        moveinInspectionDeadlineDate: item.MoveinInspectionDeadlineDate || "NA",
                        noticetoVacateDate: item.NoticetoVacateDate || "NA",
                        securityDepositReturnDate: item.SecurityDepositReturnDate || "NA",
                        rentDueDate: firstOfNextMonth.toLocaleDateString("en-US", { // Format the date as "MMMM, DD, YYYY"
                            year: 'numeric',
                            month: 'long',
                            day: '2-digit'
                        }),        
                        renewalOfferDate: item.RenewalOfferDate || "NA" 
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
