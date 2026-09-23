import { expect, test } from "vitest";
import { parseSignIn, parseSignUp } from "./account-input";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
};

test("sign-up cleans the name and email", () => {
  const { name, email, errors } = parseSignUp(form({ nombre: "  Ana   Díaz ", correo: " Ana@Gmail.COM ", contrasena: "mercado-2026" }));
  expect(errors).toEqual({});
  expect(name).toBe("Ana Díaz");
  expect(email).toBe("ana@gmail.com");
});

test("sign-up explains each problem", () => {
  expect(parseSignUp(form({ nombre: "A", correo: "ana", contrasena: "corta" })).errors).toEqual({
    name: "Escribe tu nombre.",
    email: expect.stringContaining("correo"),
    password: expect.stringContaining("8"),
  });
  expect(parseSignUp(form({ nombre: "Ana", correo: "ana@gmail.com", contrasena: "ANA@gmail.com" })).errors.password).toMatch(/correo/);
});

test("sign-in only needs an email and some password", () => {
  expect(parseSignIn(form({ correo: "ana@gmail.com", contrasena: "x" })).errors).toEqual({});
  expect(Object.keys(parseSignIn(form({ correo: "", contrasena: "" })).errors)).toEqual(["email", "password"]);
});
