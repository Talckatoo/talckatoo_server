const { Netmask } = require("netmask");
import { Request, Response, NextFunction } from "express";

// Cloudflare IP ranges (update this list from https://www.cloudflare.com/ips/)
const cloudflareIPs: string[] = [
  //IPv4 ranges
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22",
  //IPv6 ranges
  "2400:cb00::/32",
  "2606:4700::/32",
  "2803:f800::/32",
  "2405:b500::/32",
  "2405:8100::/32",
  "2a06:98c0::/29",
  "2c0f:f248::/32",
];

// Allowlist for local development
const allowlistIPs: string[] = [
  "127.0.0.1", // IPv4 localhost
  "::1", // IPv6 localhost
  "::ffff:127.0.0.1", // IPv4-mapped IPv6 localhost
];

const checkIpAddress = (req: Request, res: Response, next: NextFunction) => {
  // Get the client IP address
  let clientIP: string | undefined;

  // Handle 'x-forwarded-for' header (can be string or string[])
  const xForwardedFor = req.headers["x-forwarded-for"];
  if (typeof xForwardedFor === "string") {
    clientIP = xForwardedFor.split(",")[0].trim(); // Take the first IP in the list
  } else if (Array.isArray(xForwardedFor)) {
    clientIP = xForwardedFor[0].trim(); // Take the first IP in the list
  } else {
    clientIP = req.socket.remoteAddress; // Fallback to remoteAddress
  }

  // If clientIP is undefined, deny access
  if (!clientIP) {
    return res.status(403).json({
      status: "error",
      message: "Access denied. Unable to determine client IP.",
    });
  }

  // Check if the client IP is in the allowlist
  const isAllowlisted = allowlistIPs.includes(clientIP);

  // Check if the client IP is in any of Cloudflare's IP ranges
  const isCloudflareIP = cloudflareIPs.some((cidr) => {
    const block = new Netmask(cidr);
    return block.contains(clientIP);
  });

  // Allow the request if the IP is in the allowlist or Cloudflare's IP ranges
  if (isAllowlisted || isCloudflareIP) {
    return next();
  }

  // Deny access if the IP is not allowed
  return res.status(403).json({
    status: "error",
    message:
      "You are trying to get accessed from IP address that are not allowed. Please try again from another IP address",
  });
};

module.exports = checkIpAddress;
