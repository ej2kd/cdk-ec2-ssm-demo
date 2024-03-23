import { Stack, StackProps } from "aws-cdk-lib";
import {
  AmazonLinuxGeneration,
  AmazonLinuxImage,
  GatewayVpcEndpointAwsService,
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  InterfaceVpcEndpointAwsService,
  IpAddresses,
  MachineImage,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class CdkEc2SsmDemoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, "DemoVpc", {
      ipAddresses: IpAddresses.cidr("10.0.0.0/16"),
      vpcName: "ec2-ssm-demo-vpc",
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "Private",
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    const endpointSecurityGroup = new SecurityGroup(
      this,
      "EndpointSecurityGroup",
      {
        vpc,
        allowAllOutbound: true,
      }
    );

    vpc.addInterfaceEndpoint("SsmEndpoint", {
      service: InterfaceVpcEndpointAwsService.SSM,
    });
    vpc.addInterfaceEndpoint("SsmMessagesEndpoint", {
      service: InterfaceVpcEndpointAwsService.SSM_MESSAGES,
    });
    vpc.addInterfaceEndpoint("EC2MessagesEndpoint", {
      service: InterfaceVpcEndpointAwsService.EC2_MESSAGES,
    });
    vpc.addGatewayEndpoint("S3GatewayEndpoint", {
      service: GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetGroupName: "Private" }],
    });

    const instanceRole = new Role(this, "InstanceRole", {
      assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
      ],
      roleName: "ec2-ssm-demo-role",
    });

    const demoInstance = new Instance(this, "DemoInstance", {
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      machineImage: MachineImage.latestAmazonLinux2023(),
      role: instanceRole,
    });
    demoInstance.connections.allowTo(endpointSecurityGroup, Port.tcp(443));
  }
}
