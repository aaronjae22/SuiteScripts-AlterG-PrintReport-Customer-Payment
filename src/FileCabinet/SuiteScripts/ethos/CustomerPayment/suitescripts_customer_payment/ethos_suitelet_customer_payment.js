/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

/**
 * Customer Payments: https://910658.app.netsuite.com/app/accounting/transactions/transactionlist.nl?Transaction_TYPE=CustPymt&whence=
 * Suitelet Script Deployment: https://910658.app.netsuite.com/app/common/scripting/scriptrecord.nl?id=2976&whence=
 */

define(['N/file', 'N/format', 'N/https', 'N/query', 'N/record', 'N/render', 'N/runtime', 'N/search'],

    (file, format, https, query, record, render, runtime, search) => {
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
            // const customerName = customerPayment.getText({fieldId: 'customer'});
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
            /* const customerRecord = record.load({id: customerId, type: 'customer', isDynamic: true});
            log.debug({title: 'Customer Record', details: customerRecord}); */

            /* let billTo = customerRecord.getValue({fieldId: 'defaultaddress'}) || "";
            billTo = billTo.replaceAll("\n", "<br/>");
            log.debug({title: 'Bill To', details: billTo}); */

            const paymentMethod = customerPayment.getText({fieldId: 'paymentmethod'});
            const creditCardNumber = customerPayment.getValue({fieldId: 'ccnumber'});

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
                paymentMethod,
                creditCardNumber,
                // billTo,
                // shipTo,
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
                    applyCreatedFrom: customerPayment.getSublistValue({
                        sublistId: applyEventsListName,
                        fieldId: 'createdfrom',
                        line: i}),
                }

                // log.debug({title: 'Apply Events', details: applyRecord});
                paymentData.applyEvents.push(applyRecord);
            }

            // log.debug({title: 'Payment data', details: paymentData});
            // log.debug({title: 'Created From', details: paymentData.applyEvents[0].applyCreatedFrom});
            const salesOrderAddresses = getSalesOrderAddress(paymentData.applyEvents[0].applyCreatedFrom);
            log.debug({title: 'Sales Order Addresses', details: salesOrderAddresses});

            let billTo = salesOrderAddresses.billaddress;
            let shipTo = salesOrderAddresses.shipaddress;

            billTo = billTo.replaceAll("\n", "<br/>");
            shipTo = shipTo.replaceAll("\n", "<br/>");

            paymentData.billTo = billTo;
            paymentData.shipTo = shipTo;


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
                        line: i}),
                    /* paymentMethod: customerPayment.getSublistValue({
                        sublistId: applyEventsListName,
                        fieldId: 'paymentmethod',
                        line: i}),
                    creditCarNumber: customerPayment.getSublistValue({
                        sublistId: applyEventsListName,
                        fieldId: 'ccnumber',
                        line: i}), */
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

        const getSalesOrderAddress = (salesOrderId) => {
            const addressInfo = search.lookupFields({
                type: search.Type.SALES_ORDER,
                id: salesOrderId,
                columns: ['billaddress', 'shipaddress', 'tranid']});

            return addressInfo;
        }


        /* const getShippingData = (customerId) => {

            let sql = `SELECT * FROM customer WHERE id = ?`

            // let sql = `SELECT defaultaddress as BillAddress FROM customer WHERE id = ?`;

            return query.runSuiteQL({query: sql, params: [customerId]}).asMappedResults();

        } */

        return {onRequest}

    });
