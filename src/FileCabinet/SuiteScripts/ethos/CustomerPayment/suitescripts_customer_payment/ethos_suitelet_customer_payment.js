/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/file', 'N/format', 'N/https', 'N/query', 'N/record', 'N/render', 'N/runtime'],
    /**
 * @param{file} file
 * @param{format} format
 * @param{https} https
 * @param{query} query
 * @param{record} record
 * @param{render} render
 * @param{runtime} runtime
 */
    (file, format, https, query, record, render, runtime) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {

            // log.debug({title: 'onRequest', details: 'Suitelet'});

            if (!scriptContext.request.method === https.Method.GET)
                return ;

            getDepositInfo(scriptContext);

        }

        const getDepositInfo = (scriptContext) => {

            const params = scriptContext.request.parameters;
            const recId = params.transactionId;
            const recType = params.recordType;

            const scriptContextAttr = {
                params,
                recId,
                recType
            };

            // log.debug({title: 'Script Context', details: scriptContextAttr});

            if (!recType || !recId)
                return ;

            if (!params.tpl)
                return ;

            const thisRec = record.load({id: recId, type: recType, isDynamic: true});

            log.debug({title: 'Record', details: thisRec});

        }

        return {onRequest}

    });
