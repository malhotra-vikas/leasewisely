# LeaseWisely AI 

## Getting Started

### Prerequisites

- Install AWS CDK `npm i -g aws-cdk`
- Install the AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html
- Notate the name of your profile
  - For example, in our /.aws/credentials file, we conventionally have a profile named `staging`.
  - When commands below reference `$PROFILE`, include `--profile staging`
- Clone the repo
- Run `npm install`
- copy `.env.example` to `.env`
  - Add the staging account number and region

#### AWS Objects

- AWS Pinpoint application is created and applicationId is copied to a text file
- applicationId is stored in resources/default.json and in utils/constants.ts
- Created application has the email channel enabled.
  - To enable the email channel, in the AWS Pinpoint console, go to Settings --> Email --> Identity details, click the Edit button and enable the email channel
- CDK stack script will create the segments, one for "marketing" and another for "clinical"
- If you need to delete a Pinpoint project, you can do it in the console in "Settings" and then "General Settings"

### Deploying

## Setting the Account ID & Pinpoint Application ID

Before you deploy, you should make sure the correct AWS account ID is included on line 1 of ```utils/constants.ts```. Next, you should make sure the PINPOINT_CONTACT_COMMUNICATIONS_APPLICATION constant in the same file is set to the correct value for the environment you're deploying to:

The correct PINPOINT_CONTACT_COMMUNICATIONS_APPLICATION value should also be set in ```resources/default.json```.

### CDK Deploy Command

`cdk deploy --profile $profile`
