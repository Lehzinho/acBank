import axios from "axios";

export const api = axios.create({
  baseURL: process.env.HOST_URL as string,
});

api.interceptors.response.use(
  (response) => {
    console.log("Interceptor response => ", response.data);
    return response;
  },
  (error) => {
    console.log("Interceptor response Error => ", error);

    if (error.response && error.response.data) {
      return Promise.reject(new Error(error.response.data.erro));
    } else {
      return Promise.reject(
        new Error("Erro no servidor. Tente novamente mais tarde.")
      );
    }
  }
);
