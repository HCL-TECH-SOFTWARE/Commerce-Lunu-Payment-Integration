package com.hcl.commerce.lunu.payment.commands;

import com.ibm.commerce.command.ControllerCommand;

public interface HCLLunuPaymentProcessCmd extends ControllerCommand {

	public static final String defaultCommandClassName = HCLLunuPaymentProcessCmdImpl.class.getName();
}
