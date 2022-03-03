INSERT INTO policy (POLICY_ID,POLICYNAME,POLICYTYPE_ID,STOREENT_ID,PROPERTIES,STARTTIME,ENDTIME,OPTCOUNTER) 
VALUES ((select max(POLICY_ID)+1 from policy),'Lunu','Payment',<storeid>,'attrPageName=StandardLunu&paymentConfigurationId=default&display=true&compatibleMode=false',null,null,1);

INSERT INTO policydesc (POLICY_ID,LANGUAGE_ID,DESCRIPTION,LONGDESCRIPTION,TIMECREATED,TIMEUPDATED,OPTCOUNTER) 
VALUES (( select POLICY_ID from policy where policyname = 'Lunu' ), <langid> ,'Lunu','Lunu',CURRENT TIMESTAMP,CURRENT TIMESTAMP,1);

INSERT INTO POLICYCMD (POLICY_ID,BUSINESSCMDCLASS,PROPERTIES,OPTCOUNTER) VALUES ((select POLICY_ID from policy where policyname = 'Lunu'),'com.ibm.commerce.payment.actions.commands.DoPaymentActionsPolicyCmdImpl',null,1);
INSERT INTO POLICYCMD (POLICY_ID,BUSINESSCMDCLASS,PROPERTIES,OPTCOUNTER) VALUES ((select POLICY_ID from policy where policyname = 'Lunu'),'com.ibm.commerce.payment.actions.commands.EditPaymentInstructionPolicyCmdImpl',null,1);
INSERT INTO POLICYCMD (POLICY_ID,BUSINESSCMDCLASS,PROPERTIES,OPTCOUNTER) VALUES ((select POLICY_ID from policy where policyname = 'Lunu'),'com.ibm.commerce.payment.actions.commands.QueryPaymentsInfoPolicyCmdImpl',null,1);


INSERT INTO STORECONF(STOREENT_ID, NAME, VALUE, OPTCOUNTER) VALUES(<storeid>, 'LUNU_APP_ID', <lunu_app_id>, 1);
INSERT INTO STORECONF(STOREENT_ID, NAME, VALUE, OPTCOUNTER) VALUES(<storeid>, 'LUNU_APP_Secret', <lunu_app_secret>, 1);

/* SANDBOX Account hostname is testing.lunu.io. Prodcution hostname is alpha.lunu.io */
INSERT INTO STORECONF(STOREENT_ID, NAME, VALUE, OPTCOUNTER) VALUES(<storeid>, 'LUNU_PAYMENT_CREATE_URL', 'https://testing.lunu.io/api/v1/payments/create', 1);
INSERT INTO STORECONF(STOREENT_ID, NAME, VALUE, OPTCOUNTER) VALUES(<storeid>,'LUNU_PAYMENT_GET_STATUS_URL', 'https://testing.lunu.io/api/v1/payments/get/', 1);
INSERT INTO STORECONF(STOREENT_ID, NAME, VALUE, OPTCOUNTER) VALUES(<storeid>, 'LUNU_EXPIRE_TOKEN_TIME', '15', 1);


INSERT INTO CMDREG (STOREENT_ID,INTERFACENAME,DESCRIPTION,CLASSNAME,PROPERTIES,LASTUPDATE,TARGET,OPTCOUNTER) VALUES (<storeid>,'com.hcl.commerce.lunu.payment.commands.HCLLunuPaymentProcessCmd',null,'com.hcl.commerce.lunu.payment.commands.HCLLunuPaymentProcessCmdImpl','retriable=1',null,'Local',1);
