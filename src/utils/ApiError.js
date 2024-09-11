// API ERROR HANDLING
//node.js gives a complete Error class , from which we can handle many types of errors
class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ){
        //overriding the constructor
        super(message)
        this.statusCode = statusCode 
        //statuscode ko override kardia mere statuscode se

        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors 

        if (stack) {
            this.stack = stack
        } else{
            Error.captureStackTrace(this, this.constructor)
        }

    }
}

export {ApiError}