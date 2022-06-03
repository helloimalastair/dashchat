const generateErrorResponse = (error: string, status?: number) => new Response(error, {status: status || 400}),
  usernameDoesNotExist = () => generateErrorResponse("Username does not exist");
export { generateErrorResponse, usernameDoesNotExist };