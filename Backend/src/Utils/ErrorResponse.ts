const generateErrorResponse = (error: string, status?: number) => {
  return new Response(JSON.stringify({ success: false, error }), {
    status: status || 400,
  });
};
export { generateErrorResponse };
