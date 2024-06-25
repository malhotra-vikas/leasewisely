#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import * as Constants from '../src/utils/constants'
import 'dotenv/config';

import { LeasewiselyStack } from '../lib/Leasewisely-stack'

const app = new cdk.App()
new LeasewiselyStack(app, 'LeasewiselyStack', {
  env: {
    account: Constants.AWS_ACCOUNT,
    region: Constants.AWS_REGION
  }
})
