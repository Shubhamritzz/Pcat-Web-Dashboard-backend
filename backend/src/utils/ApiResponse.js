class ApiResponse {
    constructor(
        statusCode,
        data,
        message = 'success',
    ){
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400 // 400 because above 400 are errors

    }
}

export { ApiResponse }