/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

/**
 * Customer Payments: https://910658.app.netsuite.com/app/accounting/transactions/transactionlist.nl?Transaction_TYPE=CustPymt&whence=
 * User Event Script Deployment: https://910658.app.netsuite.com/app/common/scripting/scriptrecord.nl?id=2975&whence=
 */

define(['N/query', 'N/record', 'N/runtime', 'N/url'],
    /**
 * @param{query} query
 * @param{record} record
 * @param{runtime} runtime
 * @param{url} url
 */
    (query, record, runtime, url) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {

            const currentUser = runtime.getCurrentUser().email;
            const isEthos = currentUser === 'harry@alterg.com';

            // log.debug({title: 'Current User', details: [currentUser, isEthos]});

            if (!isEthos)
                return ;

            const eventType = scriptContext.type;
            const isView =  eventType === scriptContext.UserEventType.VIEW;

            // log.debug({title: 'Event Type', details: [eventType, isView]});

            if (!isView)
                return ;

            const thisRec = scriptContext.newRecord;
            const recordType = thisRec.type;
            const transactionId = thisRec.id;

            /* const recordData = {
                // thisRec,
                recordType,
                tranId,
            };

            log.debug({title: 'Record Data', details: recordData}); */

            const thisObj = {
                recordType: recordType,
                transactionId: transactionId,
            };

            const thisForm = scriptContext.form;
            // log.debug({title: 'This form', details: thisForm});

            const contextAttributes = {
                eventType,
                isView,
                // thisRec,
                recordType,
                transactionId,
            };

            const contextObjects = {
                thisObj,
                thisForm,
            };

            log.debug({title: 'Context Attributes', details: contextAttributes});
            log.debug({title: 'Object and Form', details: contextObjects});

            showPrintButton(thisForm, thisObj);

        }

        const showPrintButton = (thisForm, thisObj) => {

            const suiteletUrl = url.resolveScript({
                scriptId: 'customscript_suitelet_customer_payment',
                deploymentId: 'customdeploy_suitelet_customer_payment',
                returnExternalUrl: false,
                params: thisObj,
            });

            // log.debug({title: 'Suitelet Url', details: suiteletUrl});

            if (!suiteletUrl)
                return ;

            thisForm.addButton({
                id: 'custpage_print_customer_payment_report',
                label: 'Print Test DT',
                functionName: `window.open("${suiteletUrl+'&tpl=customerdeposit'}", "_blank");`,
            });

        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
