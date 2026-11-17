const rm = new Intl.NumberFormat("ms-MY", { style: "currency", currency: "MYR" })
export const formatRM = (n: number) => rm.format(n)
export const formatDate = (d: string | Date) => new Intl.DateTimeFormat("en-MY", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur" }).format(new Date(d))
