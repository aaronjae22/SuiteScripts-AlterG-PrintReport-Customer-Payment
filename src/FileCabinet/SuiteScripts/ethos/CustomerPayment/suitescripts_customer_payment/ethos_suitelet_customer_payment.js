/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/file', 'N/format', 'N/https', 'N/query', 'N/record', 'N/render', 'N/runtime'],

    (file, format, https, query, record, render, runtime) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {

            if (!scriptContext.request.method === https.Method.GET)
                return ;

            const paymentData = getPaymentRecord(scriptContext);

            log.debug({title: 'Payment Data', details: paymentData});

            return generateReport(scriptContext, paymentData);

        }

        const getPaymentRecord = (scriptContext) => {

            const params = scriptContext.request.parameters;
            const recId = params.transactionId;
            const recType = params.recordType;

            /* const scriptContextAttr = {
                params,
                recId,
                recType
            };

            // log.debug({title: 'Script Context', details: scriptContextAttr}); */

            if (!recType || !recId)
                return ;

            if (!params.tpl)
                return ;

            const customerPayment = record.load({id: recId, type: recType, isDynamic: true});

            const paymentData = getPaymentData(scriptContext, customerPayment);

            return paymentData;
        }


        const getPaymentData = (scriptContext, customerPayment) => {

            // Getting Apply Events List Info from Netsuite //
            const applyEventsListName = 'apply';
            const applyEventsLineCount = customerPayment.getLineCount({sublistId: applyEventsListName});

            // Getting Payment Events List Info from Netsuite //
            const paymentEventsListName = 'paymentevent';
            const paymentEventsLineCount = customerPayment.getLineCount({sublistId: paymentEventsListName});

            // log.debug({title: 'Line Counts', details: [applyEventsLineCount, paymentEventsLineCount]});

            // Getting Customer Payment Primary Info //
            const status = customerPayment.getValue({fieldId: 'status'});
            const arAccount = customerPayment.getText({fieldId: 'aracct'});
            const account = customerPayment.getText({fieldId: 'account'});
            const customerName = customerPayment.getText({fieldId: 'customer'});
            const customerId = customerPayment.getValue({fieldId: 'customer'});
            const transactionId = customerPayment.getValue({fieldId: 'tranid'});
            const currency = customerPayment.getText({fieldId: 'currency'});
            const transactionDate = format.format({type: format.Type.DATE, value: customerPayment.getValue({fieldId: 'trandate'})});
            const postingPeriod = customerPayment.getText({fieldId: 'postingperiod'});

            const currentDate = new Date();
            const printedDate = format.format({type: format.Type.DATE, value: currentDate});

            const pending = customerPayment.getValue({fieldId: 'pending'});
            const memo = customerPayment.getValue({fieldId: 'memo'});
            const subsidiary = customerPayment.getText({fieldId: 'subsidiary'});
            const department = customerPayment.getText({fieldId: 'department'});
            const location = customerPayment.getText({fieldId: 'location'});

            // Load Customer Record //
            const customerRecord = record.load({id: customerId, type: 'customer', isDynamic: true});
            log.debug({title: 'Customer Record', details: customerRecord});

            const billTo = customerRecord.getValue({fieldId: 'defaultaddress'});
            log.debug({title: 'Bill To', details: billTo});

            const paymentData = {
                status,
                arAccount,
                account,
                customerName,
                customerId,
                transactionId,
                currency,
                transactionDate,
                postingPeriod,
                printedDate,
                pending,
                memo,
                subsidiary,
                department,
                location,
                billTo,
                applyEvents: [],
                paymentEvents: [],
            };

            // log.debug({title: 'Payment Data', details: paymentData});

            // Getting Apply Events Info //

            for (let i = 0; i < applyEventsLineCount; i++)
            {
                let applyRecord = {
                    applyDate: format.format({type: format.Type.DATE,
                        value: customerPayment.getSublistValue({
                            sublistId: applyEventsListName,
                            fieldId: 'applydate',
                            line: i})}),
                    /*applyDate: customerPayment.getSublistValue({
                       sublistId: applyEventsListName,
                       fieldId: 'applydate',
                       line: i}),*/
                    applyType: customerPayment.getSublistValue({
                        sublistId: applyEventsListName,
                        fieldId: 'type',
                        line: i}),
                    applyRefNumber: customerPayment.getSublistValue({
                        sublistId: applyEventsListName,
                        fieldId: 'refnum',
                        line: i }),
                    applyAmount: customerPayment.getSublistValue({
                        sublistId: applyEventsListName,
                        fieldId: 'amount',
                        line: i}),
                    applyDue: customerPayment.getSublistValue({
                        sublistId: applyEventsListName,
                        fieldId: 'due',
                        line: i}),
                    applyCurrency: customerPayment.getSublistValue({
                        sublistId: applyEventsListName,
                        fieldId: 'currency',
                        line: i}),
                    applyPayment: customerPayment.getSublistValue({
                        sublistId: applyEventsListName,
                        fieldId: 'total',
                        line: i}),
                }

                // log.debug({title: 'Apply Events', details: applyRecord});
                paymentData.applyEvents.push(applyRecord);
            }

            // log.debug({title: 'Payment data', details: paymentData});

            // Getting Payment Events Info //
            for (let i = 0; i < paymentEventsLineCount; i++)
            {
                let eventRecord = {
                    transaction: customerPayment.getSublistValue({
                        sublistId: paymentEventsListName,
                        fieldId: 'owningtransaction',
                        line: i}),
                    /* transactionDate: customerDeposit.getSublistValue({
                        sublistId: paymentEventsListName,
                        fieldId: 'eventdate',
                        line: i}),*/
                    transactionDate: format.format({type: format.Type.DATE,
                        value: customerPayment.getSublistValue({
                            sublistId : paymentEventsListName,
                            fieldId : 'eventdate',
                            line : i})}),
                    tranEvent: customerPayment.getSublistValue({
                        sublistId: paymentEventsListName,
                        fieldId: 'type',
                        line: i}),
                    tranHandling: customerPayment.getSublistValue({
                        sublistId: paymentEventsListName,
                        fieldId: 'eventtype',
                        line: i}),
                    paymentOption: customerPayment.getSublistValue({
                        sublistId: paymentEventsListName,
                        fieldId: 'card',
                        line: i}),
                    result: customerPayment.getSublistValue({
                        sublistId: paymentEventsListName,
                        fieldId: 'result',
                        line: i}),
                    reason: customerPayment.getSublistValue({
                        sublistId: paymentEventsListName,
                        fieldId: 'holdreason',
                        line: i}),
                    amount: customerPayment.getSublistValue({
                        sublistId: paymentEventsListName,
                        fieldId: 'amount',
                        line: i})

                }

                // log.debug({title: 'Event Record', details: eventRecord});
                paymentData.paymentEvents.push(eventRecord);

            }

            // log.debug({title: 'Payment Data', details: paymentData});
            return paymentData;

        }



        const generateReport = (scriptContext, paymentData) => {

            const reportPDFTemplate = '/SuiteScripts/ethos/CustomerPayment/html_templates/customer_payment_report.html';

            const renderer = render.create();

            const templateFile = file.load({id: reportPDFTemplate});

            renderer.addCustomDataSource({
                alias: 'record',
                format: render.DataSource.OBJECT,
                data: paymentData,
            });

            renderer.templateContent = templateFile.getContents();
            // log.debug({title: 'RENDERER TEMPLATE CONTENT', details: renderer.templateContent});

            const pdfFile = renderer.renderAsPdf();
            // log.debug({title: 'PDF File', details: pdfFile});

            return scriptContext.response.writeFile(pdfFile, true);

        }


        /* const getShippingData = (customerId) => {

            let sql = `SELECT * FROM customer WHERE id = ?`

            // let sql = `SELECT defaultaddress as BillAddress FROM customer WHERE id = ?`;

            return query.runSuiteQL({query: sql, params: [customerId]}).asMappedResults();

        } */

        return {onRequest}

    });
