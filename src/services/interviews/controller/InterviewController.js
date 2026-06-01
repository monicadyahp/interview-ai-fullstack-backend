import interviewService from "../service/InterviewService.js";
import ClientError from "../../../exceptions/client-error.js";
import ApiError from "../../../utils/ApiError.js";

const handleError = (res, error) => {
  if (error instanceof ClientError) {
    return res
      .status(error.statusCode)
      .json({ status: "fail", message: error.message });
  }
  if (error instanceof ApiError) {
    return res
      .status(error.statusCode)
      .json({ status: "fail", message: error.message });
  }
  console.error("[InterviewController]", error);
  return res
    .status(500)
    .json({ status: "error", message: "Terjadi kesalahan pada server" });
};

// GET /api/interviews/pre-launch
export const getPreLaunchInfo = async (req, res) => {
  try {
    const data = await interviewService.getPreLaunchInfo(req.user.id);
    return res.status(200).json({ status: "success", data });
  } catch (error) {
    return handleError(res, error);
  }
};

// POST /api/interviews/validate-launch
export const validateLaunch = async (req, res) => {
  try {
    const result = await interviewService.validateLaunch(req.body);
    const httpStatus = result.valid ? 200 : 422;
    return res
      .status(httpStatus)
      .json({ status: result.valid ? "success" : "fail", ...result });
  } catch (error) {
    return handleError(res, error);
  }
};

// POST /api/interviews/sessions
export const startSession = async (req, res) => {
  try {
    const session = await interviewService.startSession(req.user.id, req.body);
    return res.status(201).json({
      status: "success",
      message: "Sesi interview dimulai",
      data: {
        sessionId: session._id,
        positionApplied: session.positionApplied,
        employmentLevel: session.employmentLevel,
        companyType: session.companyType,
        simulationLevel: session.simulationLevel,
        durationMinutes: session.durationMinutes,
        startedAt: session.startedAt,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// POST /api/interviews/sessions/:id/predict
export const predict = async (req, res) => {
  try {
    const result = await interviewService.predict(
      req.params.id,
      req.user.id,
      req.file,
    );
    return res.status(200).json({
      status: "success",
      message: "Prediksi emosi berhasil",
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// PATCH /api/interviews/sessions/:id/complete
export const completeSession = async (req, res) => {
  try {
    const session = await interviewService.completeSession(
      req.params.id,
      req.user.id,
    );
    return res.status(200).json({
      status: "success",
      message: "Sesi interview selesai",
      data: session,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// PATCH /api/interviews/sessions/:id/abandon
export const abandonSession = async (req, res) => {
  try {
    const session = await interviewService.abandonSession(
      req.params.id,
      req.user.id,
    );
    return res.status(200).json({
      status: "success",
      message: "Sesi interview ditinggalkan",
      data: session,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// GET /api/interviews/sessions
export const getSessions = async (req, res) => {
  try {
    const { status } = req.query;
    const sessions = await interviewService.getUserSessions(req.user.id, {
      status,
    });
    return res.status(200).json({ status: "success", data: sessions });
  } catch (error) {
    return handleError(res, error);
  }
};

// GET /api/interviews/sessions/:id
export const getSessionById = async (req, res) => {
  try {
    const session = await interviewService.getSessionById(
      req.params.id,
      req.user.id,
    );
    return res.status(200).json({ status: "success", data: session });
  } catch (error) {
    return handleError(res, error);
  }
};

// GET /api/interviews/sessions/:id/summary
export const getSessionSummary = async (req, res) => {
  try {
    const data = await interviewService.getSessionSummary(
      req.params.id,
      req.user.id,
    );
    return res.status(200).json({ status: "success", data });
  } catch (error) {
    return handleError(res, error);
  }
};

// GET /api/interviews/sessions/:id/export
export const exportSession = async (req, res) => {
  try {
    const pdfBuffer = await interviewService.exportSessionPDF(
      req.params.id,
      req.user.id,
    );
    const filename = `intersight-session-${req.params.id}.pdf`;
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.length,
    });
    return res.send(pdfBuffer);
  } catch (error) {
    return handleError(res, error);
  }
};

// GET /api/interviews/dashboard
export const getDashboard = async (req, res) => {
  try {
    const data = await interviewService.getDashboard(req.user.id);
    return res.status(200).json({ status: "success", data });
  } catch (error) {
    return handleError(res, error);
  }
};

// GET /api/interviews/dashboard/trend?period=6m|1y
export const getPerformanceTrend = async (req, res) => {
  try {
    const period = req.query.period === "1y" ? "1y" : "6m";
    const data = await interviewService.getPerformanceTrend(
      req.user.id,
      period,
    );
    return res.status(200).json({ status: "success", data });
  } catch (error) {
    return handleError(res, error);
  }
};
