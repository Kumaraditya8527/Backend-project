class ApiResponse{
    constructor(statusCode, message="success", data=null){
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode < 400; // Set success to true for 2xx status codes, false otherwise
    }
}