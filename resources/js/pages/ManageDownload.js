import React, { useEffect, useState } from "react";
import {
    Container,
    Row,
    Col,
    Table,
    Button,
    Spinner,
    Alert,
    Badge,
} from "react-bootstrap";
import { csv } from "d3-request";
import DataTable from "react-data-table-component";
import request from "../lib/request";
import { FullScreenModal } from "../components/Modal";
import { uiText } from "../static/ui-text";
import { useLocale } from "../lib/locale-context";
import takeRight from "lodash/takeRight";
import isEmpty from "lodash/isEmpty";
import { useAuth } from "../components/auth-context";

const datatableCustomStyle = {
    headCells: {
        style: {
            background: "#673016",
            color: "#fff",
            fontWeight: "bold",
        },
    },
};

const Loading = () => (
    <Spinner
        animation="border"
        role="status"
        size="sm"
        variant="info"
        style={{ marginTop: "10vh" }}
    >
        <span className="sr-only">Loading...</span>
    </Spinner>
);

const ManageDownload = () => {
    const { locale } = useLocale();
    const { user } = useAuth();
    const [log, setLog] = useState([]);
    const [reload, setReload] = useState(false);
    const [isViewFile, setIsViewFile] = useState(false);
    const [fileLoaded, setFileLoaded] = useState({});
    let text = uiText[locale.active];

    useEffect(async () => {
        const { data, status } = await request().get("/api/download-log");
        if (status === 200) {
            const result = data?.map((d) => {
                let filename = d?.filepath?.split("/");
                filename = takeRight(filename)[0];
                return {
                    ...d,
                    filename: filename,
                    isLoading: false,
                };
            });
            setLog(result);
        }
        setReload(false);
    }, [reload]);

    const handleViewButton = ({ id, filepath, filename }) => {
        setIsViewFile(true);
        csv(filepath, (error, data) => {
            if (error) {
                setFileLoaded({
                    id: id,
                    title: filename,
                    data: [],
                    columns: [],
                });
                throw error;
            }
            const columns = data?.columns?.map((col) => {
                let width = "5%";
                if (col === "repeat") {
                    width = "7%";
                }
                if (col === "groupName") {
                    width = "15%";
                }
                if (col === "question" || col === "answer") {
                    width = "34%";
                }
                return {
                    id: col,
                    name: col,
                    width: width,
                    wrap: true,
                    selector: (row) => row[col],
                };
            });
            const dataTemp = data?.map((d, di) => {
                return {
                    id: di + 1,
                    ...d,
                };
            });
            setFileLoaded({
                id: id,
                title: filename,
                data: dataTemp,
                columns: columns,
            });
        });
    };

    const setLoading = (id, status) => {
        const updateLog = log?.map((l) => {
            return {
                ...l,
                isLoading: l?.id === id ? status : l.isLoading,
            };
        });
        setLog(updateLog);
    };

    const handleApproveRejectButton = async (selected, logStatus) => {
        /** # TODO:: Send OTP, then show form to input OTP,
         * after that continue with OTP code check
         * then approve/reject process */
        // const test = await request().get(
        //     `/api/verification/send-otp/${user?.id}`
        // );
        setIsViewFile(false);
        setLoading(selected?.id, logStatus);
        const { data, status } = await request().patch(
            `/api/download-log/update-status/${selected?.id}`,
            {
                status: logStatus,
            }
        );
        if (status === 200) {
            setReload(true);
        }
        setLoading(selected?.id, false);
    };

    const renderLogTable = () => {
        if (log.length === 0) {
            return (
                <tr key="submission-no-data">
                    <td colSpan="4" className="pl-3 text-muted text-center">
                        {text.infoNoDownloadRequest}
                    </td>
                </tr>
            );
        }

        return log.map((l, li) => (
            <tr key={`${l.filename}-${li}`}>
                <td className="pl-3">{l?.filename || ""}</td>
                <td className="pl-3">
                    <Badge
                        variant={
                            l?.status === "requested"
                                ? "secondary"
                                : l?.status === "rejected"
                                ? "danger"
                                : "success"
                        }
                    >
                        {l?.status}
                    </Badge>
                </td>
                <td className="pl-3">{l?.request_by?.email || ""}</td>
                <td className="pl-3">
                    <Button
                        variant="info"
                        size="sm"
                        onClick={() => handleViewButton(l)}
                    >
                        {text.btnView}
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        style={{ marginLeft: "8px" }}
                        onClick={() => handleApproveRejectButton(l, "approved")}
                        disabled={l?.isLoading === "approved"}
                    >
                        <>
                            {l?.isLoading === "approved" && (
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    style={{
                                        marginRight: "8px",
                                    }}
                                />
                            )}
                            {text.btnApprove}
                        </>
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        style={{ marginLeft: "8px" }}
                        onClick={() => handleApproveRejectButton(l, "rejected")}
                        disabled={l?.isLoading === "rejected"}
                    >
                        <>
                            {l?.isLoading === "rejected" && (
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    style={{
                                        marginRight: "8px",
                                    }}
                                />
                            )}
                            {text.btnReject}
                        </>
                    </Button>
                </td>
            </tr>
        ));
    };

    return (
        <Container fluid>
            <Row className="justify-content-center">
                <Col className="mx-auto" md="10">
                    <h3>{text.navManageDownloadRequest}</h3>
                    {/* <p>{text.textInfoSubmission}</p> */}
                    <hr />
                    {/* {renderAlert()} */}
                    <Table bordered hover responsive size="sm">
                        <thead>
                            <tr>
                                <th className="pl-3">{text.tbColFilename}</th>
                                <th className="pl-3">{text.tbColStatus}</th>
                                <th className="pl-3">{text.tbColRequestBy}</th>
                                <th className="pl-3">{text.tbColAction}</th>
                            </tr>
                        </thead>
                        <tbody>{renderLogTable()}</tbody>
                    </Table>
                </Col>
            </Row>
            <FullScreenModal
                text={text}
                title={fileLoaded?.title || ""}
                show={isViewFile}
                handleClose={() => setIsViewFile(false)}
                handleApprove={() =>
                    handleApproveRejectButton(fileLoaded, "approved")
                }
                handleReject={() =>
                    handleApproveRejectButton(fileLoaded, "rejected")
                }
                content={
                    <Row className="justify-content-center">
                        <Col id="fileLoadedTmp" className="mx-auto" md="12">
                            <DataTable
                                columns={fileLoaded?.columns || []}
                                data={fileLoaded?.data || []}
                                fixedHeader
                                fixedHeaderScrollHeight="70vh"
                                progressPending={isEmpty(fileLoaded)}
                                progressComponent={<Loading />}
                                customStyles={datatableCustomStyle}
                            />
                        </Col>
                    </Row>
                }
            />
        </Container>
    );
};

export default ManageDownload;
