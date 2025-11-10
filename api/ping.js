export default function handler(req, res) {
  console.log("PING HIT", req.method, req.url);
  res.status(200).json({ ok: true, path: req.url });
}
