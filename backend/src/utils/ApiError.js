class ApiError extends Error {
    constructor(
        statusCode,
        message = 'something went wrong',
        errors = [],
        stack = ''
    ) {
        super(message); // call parent class (Error) constructor
        this.statusCode = statusCode;
        this.errors = errors
        this.success = false;
        this.data = null;
        this.message = message;

        if (stack) { // if stack is provided, you could set it here
        } else {
            Error.captureStackTrace(this, this.constructor)
        }

    }
}


export { ApiError }